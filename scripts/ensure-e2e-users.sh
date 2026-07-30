#!/usr/bin/env bash
# Ensure a dedicated Jellyfin user exists for THIS acceptance area, so no two
# CI areas ever sign in as the same user. Concurrent logins as one shared user
# serialized on Jellyfin's session/token-write path — auth ballooned to 30-60s
# during a run while reads stayed fast (classic lock contention, not CPU). One
# user per area removes that contention entirely.
#
# Idempotent: creates cadence-e2e-<area> with TEST_PASSWORD if absent, no-ops if
# it already exists. Needs an ADMIN token (JELLYFIN_ADMIN_KEY / JELLYFIN_API_KEY)
# — regular e2e creds can't create users. Never fails the job on a transient
# error; the tests still gate.
set -u

URL="${VITE_JELLYFIN_URL:-}"
[ -z "$URL" ] && URL="$(grep -hE '^VITE_JELLYFIN_URL=.' .env .env.local 2>/dev/null | head -1 | cut -d= -f2-)"
ADMIN="${JELLYFIN_ADMIN_KEY:-${JELLYFIN_API_KEY:-}}"
AREA="${AREA:-${1:-}}"
PW="${TEST_PASSWORD:-}"

if [ -z "$URL" ] || [ -z "$ADMIN" ] || [ -z "$AREA" ] || [ -z "$PW" ]; then
  echo "ensure-e2e-users: missing URL/ADMIN key/AREA/TEST_PASSWORD — skipping"
  exit 0
fi

USERNAME="cadence-e2e-${AREA}"
URL="${URL%/}"

# Already exists? (case-insensitive match on the user list)
if curl -s --max-time 30 "$URL/Users" -H "X-Emby-Token: $ADMIN" \
  | grep -qi "\"Name\":\"${USERNAME}\""; then
  echo "ensure-e2e-users: '${USERNAME}' already exists"
  exit 0
fi

echo "ensure-e2e-users: creating '${USERNAME}'"
code=$(curl -s -o /tmp/newuser.json -w '%{http_code}' --max-time 30 \
  -X POST "$URL/Users/New" -H "X-Emby-Token: $ADMIN" \
  -H 'Content-Type: application/json' \
  -d "$(printf '{"Name":"%s","Password":"%s"}' "$USERNAME" "$PW")")

if [ "$code" = "200" ] || [ "$code" = "204" ]; then
  echo "ensure-e2e-users: created '${USERNAME}'"
else
  echo "ensure-e2e-users: create returned HTTP $code — proceeding anyway"
fi
exit 0
