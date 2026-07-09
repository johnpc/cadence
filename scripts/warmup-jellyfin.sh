#!/usr/bin/env bash
# Prime the Jellyfin auth path so the cold-start latency (cloudflared tunnel +
# auth cold path) is absorbed HERE, before the acceptance tests sign in. The
# first request after an idle gap can take 12-15s+; subsequent ones are ~0.2s.
# We retry a bounded number of times until one succeeds (or give up without
# failing the job — the tests' own retries remain the real gate).
set -u

URL="$(grep -E '^VITE_JELLYFIN_URL=' .env | cut -d= -f2-)"
if [ -z "${URL:-}" ]; then
  echo "warmup: no VITE_JELLYFIN_URL in .env — skipping"
  exit 0
fi

BODY=$(printf '{"Username":"%s","Pw":"%s"}' "${TEST_USERNAME:-}" "${TEST_PASSWORD:-}")
AUTH='MediaBrowser Client="ci-warmup", Device="ci", DeviceId="ci-warmup", Version="1"'

for attempt in 1 2 3 4 5; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 \
    -X POST "$URL/Users/AuthenticateByName" \
    -H 'Content-Type: application/json' -H "X-Emby-Authorization: $AUTH" \
    -d "$BODY")
  echo "warmup attempt $attempt: HTTP $code"
  if [ "$code" = "200" ]; then
    echo "warmup: Jellyfin auth is warm"
    exit 0
  fi
  sleep 3
done

echo "warmup: auth never returned 200 — proceeding anyway (tests will retry)"
exit 0
