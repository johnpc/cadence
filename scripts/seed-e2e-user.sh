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
# Idempotent: if an owned playlist already exists, it does nothing. Auth is a
# Subsonic salt+token pair from Navidrome's native /auth/login — verified fresh
# server-side on every call, no server-side session to go stale.
#
# Never fails the job (exit 0) — the tests' own retries remain the real gate.
set -u

URL="${VITE_NAVIDROME_URL:-}"
[ -z "$URL" ] && URL="$(grep -hE '^VITE_NAVIDROME_URL=.' .env .env.local 2>/dev/null | head -1 | cut -d= -f2-)"
if [ -z "${URL:-}" ] || [ -z "${TEST_USERNAME:-}" ] || [ -z "${TEST_PASSWORD:-}" ]; then
  echo "seed: missing URL or creds — skipping"
  exit 0
fi

AUTH=$(curl -s --max-time 30 -X POST "$URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d "$(printf '{"username":"%s","password":"%s"}' "$TEST_USERNAME" "$TEST_PASSWORD")")
SALT=$(printf '%s' "$AUTH" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("subsonicSalt",""))' 2>/dev/null || true)
TOK=$(printf '%s' "$AUTH" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("subsonicToken",""))' 2>/dev/null || true)
if [ -z "$TOK" ] || [ -z "$SALT" ]; then echo "seed: auth failed — skipping (tests will retry)"; exit 0; fi
Q="u=$TEST_USERNAME&t=$TOK&s=$SALT&v=1.16.1&c=seed&f=json"

owned_count() {
  curl -s --max-time 30 "$URL/rest/getPlaylists?$Q" \
    | python3 -c "import sys,json;u='$TEST_USERNAME';print(len([x for x in json.load(sys.stdin)['subsonic-response']['playlists'].get('playlist',[]) if x.get('owner')==u]))" 2>/dev/null || echo 0
}

if [ "$(owned_count)" -ge 1 ]; then
  echo "seed: cadence-test already owns a playlist — nothing to do"
else
  IDS=$(curl -s --max-time 30 "$URL/rest/getRandomSongs?$Q&size=15" \
    | python3 -c 'import sys,json;print("&".join("songId="+x["id"] for x in json.load(sys.stdin)["subsonic-response"]["randomSongs"].get("song",[])))' 2>/dev/null || true)
  code=$(curl -s --max-time 45 -o /dev/null -w '%{http_code}' \
    "$URL/rest/createPlaylist?$Q&name=Cadence%20Test%20Mix&$IDS")
  echo "seed: created owned playlist (HTTP $code)"
fi

# Ensure a followed artist exists (Made-for-you / Your artists shelves).
FAV=$(curl -s --max-time 30 "$URL/rest/getStarred2?$Q" \
  | python3 -c 'import sys,json;print(len(json.load(sys.stdin)["subsonic-response"]["starred2"].get("artist",[])))' 2>/dev/null || echo 0)
if [ "$FAV" -ge 1 ]; then
  echo "seed: cadence-test already follows an artist"
else
  AID=$(curl -s --max-time 30 "$URL/rest/getArtists?$Q" \
    | python3 -c 'import sys,json;idx=json.load(sys.stdin)["subsonic-response"]["artists"].get("index",[]);arts=[a for i in idx for a in i.get("artist",[])];print(arts[0]["id"] if arts else "")' 2>/dev/null || true)
  [ -n "$AID" ] && curl -s --max-time 30 -o /dev/null -w 'seed: followed an artist (HTTP %{http_code})\n' \
    "$URL/rest/star?$Q&artistId=$AID"
fi

echo "seed: done"
exit 0
