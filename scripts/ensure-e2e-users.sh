#!/usr/bin/env bash
# Ensure a dedicated Jellyfin user exists for THIS acceptance area, so no two CI
# areas ever sign in as the same user (concurrent logins as one shared user
# serialize on Jellyfin's session/token-write path).
#
# Idempotent: creates cadence-e2e-<area> with TEST_PASSWORD if absent, resets the
# password if present (so a rotated TEST_PASSWORD always wins), and grants access
# to every library. Needs an ADMIN token (JELLYFIN_ADMIN_KEY / JELLYFIN_API_KEY).
#
# FAILS LOUDLY. If this script cannot guarantee the user, the acceptance run
# cannot possibly pass — exiting 0 here only moves the failure into a 25-minute
# sign-in hang with no useful error. Jellyfin 12 rejects the legacy
# `X-Emby-Token` header (401); auth must ride in `Authorization: MediaBrowser …`.
set -euo pipefail

URL="${VITE_JELLYFIN_URL:-}"
[ -z "$URL" ] && URL="$(grep -hE '^VITE_JELLYFIN_URL=.' .env .env.local 2>/dev/null | head -1 | cut -d= -f2-)"
ADMIN="${JELLYFIN_ADMIN_KEY:-${JELLYFIN_API_KEY:-}}"
AREA="${AREA:-${1:-}}"
PW="${TEST_PASSWORD:-}"
: "${URL:?VITE_JELLYFIN_URL is required}" "${ADMIN:?JELLYFIN_ADMIN_KEY is required}" "${AREA:?AREA is required}" "${PW:?TEST_PASSWORD is required}"
URL="${URL%/}"
USERNAME="${USERNAME_OVERRIDE:-cadence-e2e-${AREA}}"
AUTH="MediaBrowser Client=\"ci-provision\", Device=\"ci\", DeviceId=\"ci-provision\", Version=\"1\", Token=\"${ADMIN}\""
jf() { curl -sS --fail-with-body --max-time 30 -H "Authorization: $AUTH" -H 'Content-Type: application/json' "$@"; }

USERS=$(jf "$URL/Users")
ID=$(printf '%s' "$USERS" | python3 -c 'import sys,json; n=sys.argv[1].lower(); print(next((u["Id"] for u in json.load(sys.stdin) if u["Name"].lower()==n), ""))' "$USERNAME")
if [ -z "$ID" ]; then
  echo "ensure-e2e-users: creating '${USERNAME}'"
  ID=$(jf -X POST "$URL/Users/New" -d "$(python3 -c 'import json,sys; print(json.dumps({"Name":sys.argv[1],"Password":sys.argv[2]}))' "$USERNAME" "$PW")" | python3 -c 'import sys,json; print(json.load(sys.stdin)["Id"])')
else
  echo "ensure-e2e-users: '${USERNAME}' exists — resetting password to TEST_PASSWORD"
  jf -X POST "$URL/Users/${ID}/Password" -d '{"ResetPassword":true}' >/dev/null
  jf -X POST "$URL/Users/${ID}/Password" -d "$(python3 -c 'import json,sys; print(json.dumps({"CurrentPw":"","NewPw":sys.argv[1]}))' "$PW")" >/dev/null
fi
# Library access: every folder, not hidden from login. No login lockout: the
# auth area deliberately signs in with a wrong password every run.
POLICY=$(jf "$URL/Users/${ID}" | python3 -c 'import sys,json; p=json.load(sys.stdin)["Policy"]; p["EnableAllFolders"]=True; p["IsHidden"]=False; p["IsDisabled"]=False; p["LoginAttemptsBeforeLockout"]=-1; print(json.dumps(p))')
jf -X POST "$URL/Users/${ID}/Policy" -d "$POLICY" >/dev/null
# Prove the credentials actually work, the same way the app signs in.
CLIENT='MediaBrowser Client="ci-provision", Device="ci", DeviceId="ci-provision-check", Version="1"'
curl -sS --fail-with-body --max-time 45 -X POST "$URL/Users/AuthenticateByName" -H 'Content-Type: application/json' \
  -H "Authorization: $CLIENT" -H "X-Emby-Authorization: $CLIENT" \
  -d "$(python3 -c 'import json,sys; print(json.dumps({"Username":sys.argv[1],"Pw":sys.argv[2]}))' "$USERNAME" "$PW")" >/dev/null
echo "ensure-e2e-users: '${USERNAME}' ready (id ${ID}), sign-in verified"
