#!/usr/bin/env bash
# Prime the Jellyfin auth path so the cold-start latency (cloudflared tunnel +
# auth cold path) is absorbed HERE, before the acceptance tests sign in. The
# first request after an idle gap can take 12-15s+; subsequent ones are ~0.2s.
# We retry a bounded number of times until one succeeds (or give up without
# failing the job — the tests' own retries remain the real gate).
set -u

# Prefer the env var (CI secret / local shell); fall back to .env then .env.local
# for local runs. The URL is intentionally NOT committed in .env.
URL="${VITE_JELLYFIN_URL:-}"
[ -z "$URL" ] && URL="$(grep -hE '^VITE_JELLYFIN_URL=.' .env .env.local 2>/dev/null | head -1 | cut -d= -f2-)"
if [ -z "${URL:-}" ]; then
  echo "warmup: no VITE_JELLYFIN_URL set — skipping"
  exit 0
fi

BODY=$(printf '{"Username":"%s","Pw":"%s"}' "${TEST_USERNAME:-}" "${TEST_PASSWORD:-}")
AUTH='MediaBrowser Client="ci-warmup", Device="ci", DeviceId="ci-warmup", Version="1"'

# Warm until auth is FAST, not merely until it returns 200. Measured against the
# live server, the first auth after idle is 30-40s and it takes ~5 hits to settle
# to a few seconds (PBKDF2 + cloudflared cold path). The old script stopped on the
# first 200 — which could itself be a 34s cold hit — leaving the tests to eat the
# slow warm-up curve and time out. Keep hitting it until a call returns under
# FAST_MS (or attempts run out); never fail the job (the tests retry too).
FAST_MS=5000
for attempt in $(seq 1 10); do
  ms=$(curl -s -o /dev/null -w '%{time_total}' --max-time 45 \
    -X POST "$URL/Users/AuthenticateByName" \
    -H 'Content-Type: application/json' -H "X-Emby-Authorization: $AUTH" \
    -d "$BODY" | awk '{printf "%d", $1 * 1000}')
  echo "warmup attempt $attempt: ${ms}ms"
  if [ -n "$ms" ] && [ "$ms" -gt 0 ] && [ "$ms" -lt "$FAST_MS" ]; then
    echo "warmup: Jellyfin auth is warm (${ms}ms < ${FAST_MS}ms)"
    exit 0
  fi
  sleep 2
done

echo "warmup: auth never settled below ${FAST_MS}ms — proceeding anyway (tests retry)"
exit 0
