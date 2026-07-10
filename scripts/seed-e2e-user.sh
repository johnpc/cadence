#!/usr/bin/env bash
# Ensure the cadence-test user OWNS at least one playlist and FOLLOWS at least
# one artist — the fixtures the acceptance suite's library/home scenarios need.
#
# Why this exists: the playlist-ownership fix (Your Library shows only playlists
# you OWN) correctly stopped surfacing other users' playlists — but it left the
# freshly-provisioned cadence-test user with an EMPTY library, so every scenario
# that opens a library playlist (or expects a followed artist) failed. This
# seeds that owned content, idempotently, before the tests run.
#
# Idempotent: if an owned playlist already exists, it does nothing. Auth writes
# use a FRESH token via X-Emby-Authorization (Token=...) — the form the app
# uses; a token that only ever did GETs can read but a stale one 401s on POST.
# Never fails the job (exit 0) — the tests' own retries remain the real gate.
set -u

URL="${VITE_JELLYFIN_URL:-}"
[ -z "$URL" ] && URL="$(grep -hE '^VITE_JELLYFIN_URL=.' .env .env.local 2>/dev/null | head -1 | cut -d= -f2-)"
if [ -z "${URL:-}" ] || [ -z "${TEST_USERNAME:-}" ] || [ -z "${TEST_PASSWORD:-}" ]; then
  echo "seed: missing URL or creds — skipping"
  exit 0
fi

XEMBY='MediaBrowser Client="seed", Device="ci", DeviceId="cadence-e2e-seed", Version="1"'
AUTH=$(curl -s --max-time 30 -X POST "$URL/Users/AuthenticateByName" \
  -H 'Content-Type: application/json' -H "X-Emby-Authorization: $XEMBY" \
  -d "$(printf '{"Username":"%s","Pw":"%s"}' "$TEST_USERNAME" "$TEST_PASSWORD")")
TOK=$(printf '%s' "$AUTH" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("AccessToken",""))' 2>/dev/null || true)
UID_=$(printf '%s' "$AUTH" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("User",{}).get("Id",""))' 2>/dev/null || true)
if [ -z "$TOK" ]; then echo "seed: auth failed — skipping (tests will retry)"; exit 0; fi
WTOK="$XEMBY, Token=\"$TOK\""

owned_count() {
  curl -s --max-time 30 "$URL/Items?IncludeItemTypes=Playlist&Recursive=true&userId=$UID_&Fields=CanDelete&Limit=200" \
    -H "X-Emby-Authorization: $WTOK" \
    | python3 -c 'import sys,json;print(len([x for x in json.load(sys.stdin).get("Items",[]) if x.get("CanDelete")]))' 2>/dev/null || echo 0
}

if [ "$(owned_count)" -ge 1 ]; then
  echo "seed: cadence-test already owns a playlist — nothing to do"
else
  IDS=$(curl -s --max-time 30 "$URL/Items?IncludeItemTypes=Audio&Recursive=true&Limit=15&userId=$UID_&SortBy=Random" \
    -H "X-Emby-Authorization: $WTOK" \
    | python3 -c 'import sys,json;print(",".join("\""+x["Id"]+"\"" for x in json.load(sys.stdin).get("Items",[])))' 2>/dev/null || true)
  code=$(curl -s --max-time 45 -o /dev/null -w '%{http_code}' -X POST "$URL/Playlists" \
    -H "X-Emby-Authorization: $WTOK" -H 'Content-Type: application/json' \
    -d "{\"Name\":\"Cadence Test Mix\",\"UserId\":\"$UID_\",\"MediaType\":\"Audio\",\"Ids\":[$IDS]}")
  echo "seed: created owned playlist (HTTP $code)"
fi

# Ensure a followed artist exists (Made-for-you / Your artists shelves).
FAV=$(curl -s --max-time 30 "$URL/Artists?Filters=IsFavorite&Limit=1&userId=$UID_" \
  -H "X-Emby-Authorization: $WTOK" \
  | python3 -c 'import sys,json;print(len(json.load(sys.stdin).get("Items",[])))' 2>/dev/null || echo 0)
if [ "$FAV" -ge 1 ]; then
  echo "seed: cadence-test already follows an artist"
else
  AID=$(curl -s --max-time 30 "$URL/Artists?Limit=1&userId=$UID_&SortBy=SortName" \
    -H "X-Emby-Authorization: $WTOK" \
    | python3 -c 'import sys,json;i=json.load(sys.stdin).get("Items",[]);print(i[0]["Id"] if i else "")' 2>/dev/null || true)
  [ -n "$AID" ] && curl -s --max-time 30 -o /dev/null -w 'seed: followed an artist (HTTP %{http_code})\n' \
    -X POST "$URL/Users/$UID_/FavoriteItems/$AID" -H "X-Emby-Authorization: $WTOK"
fi

echo "seed: done"
exit 0
