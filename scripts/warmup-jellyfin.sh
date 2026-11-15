#!/usr/bin/env bash
# Prime the Jellyfin auth path before the acceptance tests sign in: the first
# auth after an idle gap can take 10s+ (PBKDF2 + tunnel cold path), later ones
# ~0.2s. Hit it until a call is fast.
#
# FAILS LOUDLY: if sign-in never returns 200, the tests cannot pass — surface
# that here, with the HTTP status, instead of letting Playwright time out later.
set -euo pipefail

URL="${VITE_JELLYFIN_URL:-}"
[ -z "$URL" ] && URL="$(grep -hE '^VITE_JELLYFIN_URL=.' .env .env.local 2>/dev/null | head -1 | cut -d= -f2-)"
: "${URL:?VITE_JELLYFIN_URL is required}" "${TEST_USERNAME:?TEST_USERNAME is required}" "${TEST_PASSWORD:?TEST_PASSWORD is required}"
URL="${URL%/}"
BODY=$(python3 -c 'import json,sys; print(json.dumps({"Username":sys.argv[1],"Pw":sys.argv[2]}))' "$TEST_USERNAME" "$TEST_PASSWORD")
AUTH='MediaBrowser Client="ci-warmup", Device="ci", DeviceId="ci-warmup", Version="1"'

FAST_MS=5000
ok=0
for attempt in $(seq 1 10); do
  out=$(curl -s -o /dev/null -w '%{http_code} %{time_total}' --max-time 45 \
    -X POST "$URL/Users/AuthenticateByName" \
    -H 'Content-Type: application/json' -H "Authorization: $AUTH" -H "X-Emby-Authorization: $AUTH" \
    -d "$BODY" || echo "000 0")
  code=${out%% *}; ms=$(awk '{printf "%d", $2 * 1000}' <<<"$out")
  echo "warmup attempt $attempt: HTTP $code in ${ms}ms"
  if [ "$code" = "200" ]; then
    ok=1
    if [ "$ms" -lt "$FAST_MS" ]; then echo "warmup: Jellyfin auth is warm"; exit 0; fi
  elif [ "$code" = "401" ]; then
    echo "warmup: Jellyfin rejected the credentials for '$TEST_USERNAME' (401) — the e2e user is missing or the password is wrong" >&2
    exit 1
  fi
  sleep 2
done
if [ "$ok" = 1 ]; then echo "warmup: auth works but stayed slow (>${FAST_MS}ms); continuing"; exit 0; fi
echo "warmup: Jellyfin auth never succeeded at $URL" >&2
exit 1
