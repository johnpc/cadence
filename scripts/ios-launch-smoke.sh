#!/usr/bin/env bash
# iOS launch smoke test: does the BUILT app actually launch in the simulator and
# reach a Home screen rendered with real Jellyfin data?
#
#   scripts/ios-launch-smoke.sh            # build web + app, run the check
#   scripts/ios-launch-smoke.sh cleanup   # remove this run's simulator + container
#                                          # (CI calls it in an always() step, for a
#                                          # cancelled job the trap never ran in)
#   SMOKE_WEB_BUILD=0 scripts/ios-launch-smoke.sh
#                                          # use the web bundle already synced into
#                                          # ios/App/App/public (the deploy job does
#                                          # this so it smokes the exact bundle it ships)
#
# WHY: a build made with Xcode 27 could not launch AT ALL ("UIScene life cycle is
# required for apps built with this SDK") and still reached App Store review,
# because nothing ever started the app. Unit tests, the Swift tests and the
# browser Gherkin suite all pass on an app that dies at launch.
#
# HOW it proves "Home rendered with data" (WKWebView content is invisible to the
# accessibility tree): the app talks to a hermetic Jellyfin (scripts/e2e-jellyfin.sh)
# THROUGH a recording proxy (scripts/ios-smoke-proxy.py). The session is seeded into
# Capacitor Preferences, so a launch goes straight to Home. PASS requires, all from
# the seeded DeviceId (i.e. the app's own web layer, having read Preferences):
#   1. GET /Users/<id>/Items/Latest → 200 with albums (the Home "Recently added" shelf
#      query ran — only Home mounts it),
#   2. GET /Items/<album>/Images/Primary → 200 for one of THOSE albums (a card for it
#      was rendered — the <img> only exists once the shelf painted),
#   3. the process is still alive ≥ SMOKE_ALIVE_SECS after launch, with no
#      "UIScene life cycle is required" fault and no crash report.
# A screenshot + the request log + the device log land in $SMOKE_OUT either way.
#
# Shared-machine hygiene (the Mac mini runs many repos' CI): a per-run simulator
# device is created and deleted, the Jellyfin container + ports are unique per run,
# and only processes this script started are stopped. No sudo, no global installs.
#
# Prereqs: npm ci, `(cd ios/App && pod install)`, Docker, Xcode with an iOS runtime.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
BUNDLE_ID=com.johncorser.cadence
DEVICE_TYPE="${SMOKE_DEVICE_TYPE:-iPhone 17 Pro}"
CONFIGURATION="${SMOKE_CONFIGURATION:-Debug}"
OUT="${SMOKE_OUT:-$ROOT/ios-smoke-output}"
DERIVED="${SMOKE_DERIVED_DATA:-$OUT/DerivedData}"
TIMEOUT="${SMOKE_TIMEOUT_SECS:-120}"
ALIVE="${SMOKE_ALIVE_SECS:-20}"
RUN_TAG="${SMOKE_RUN_TAG:-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-$$}}"
export E2E_JELLYFIN_NAME="${E2E_JELLYFIN_NAME:-cadence-smoke-$RUN_TAG}"
SIM_NAME="cadence-smoke-$RUN_TAG"
SIM_USER=cadence-e2e-ios-sim
PASSWORD="${TEST_PASSWORD:-cadence-e2e-pass}"
SMOKE_DEVICE_ID="cadence-ios-smoke-$RUN_TAG"

if [ "${1:-}" = "cleanup" ]; then
  for udid in $(xcrun simctl list devices | sed -n "s/^ *$SIM_NAME (\([0-9A-F-]*\)).*/\1/p"); do
    xcrun simctl shutdown "$udid" >/dev/null 2>&1 || true # already shut down is fine
    xcrun simctl delete "$udid" && echo "ios-smoke: deleted simulator $udid"
  done
  exec bash "$ROOT/scripts/e2e-jellyfin.sh" down
fi

free_port() { python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1])'; }
export E2E_JELLYFIN_PORT="${E2E_JELLYFIN_PORT:-$(free_port)}"
PROXY_PORT="$(free_port)"
JF_URL="http://127.0.0.1:$E2E_JELLYFIN_PORT"
APP_URL="http://127.0.0.1:$PROXY_PORT"

mkdir -p "$OUT"
rm -f "$OUT/home.png" "$OUT/device.log" "$OUT/app.stdout" # never report a previous run's evidence
REQUESTS="$OUT/requests.jsonl"
UDID="" PROXY_PID="" APP_PID="" STARTED=""
say() { echo "ios-smoke: $*"; }

collect() {
  [ -n "$UDID" ] || return 0
  xcrun simctl io "$UDID" screenshot "$OUT/home.png" >/dev/null 2>&1 && say "screenshot → $OUT/home.png" || true
  if [ -n "$STARTED" ]; then
    xcrun simctl spawn "$UDID" log show --style compact --start "$STARTED" \
      --predicate 'process == "App" AND NOT subsystem BEGINSWITH "com.apple.WebKit"' >"$OUT/device.log" 2>&1 || true
  fi
}

cleanup() {
  local rc=$?
  set +e
  [ -n "$PROXY_PID" ] && { kill "$PROXY_PID" 2>/dev/null; wait "$PROXY_PID" 2>/dev/null; }
  if [ -n "$UDID" ]; then
    xcrun simctl shutdown "$UDID" >/dev/null 2>&1
    xcrun simctl delete "$UDID" >/dev/null 2>&1
  fi
  bash "$ROOT/scripts/e2e-jellyfin.sh" down
  exit "$rc"
}
trap cleanup EXIT

fail() {
  echo "ios-smoke: FAIL — $*" >&2
  collect
  grep -m3 "UIScene life cycle is required" "$OUT/device.log" >&2 2>/dev/null || true
  if [ -s "$OUT/device.log" ]; then
    echo "---- device log (process App), last 60 lines ----" >&2
    tail -60 "$OUT/device.log" >&2
  fi
  [ -s "$OUT/app.stdout" ] && { echo "---- app stdout/stderr, last 40 lines ----" >&2; tail -40 "$OUT/app.stdout" >&2; }
  [ -s "$REQUESTS" ] && { echo "---- requests the app made ----" >&2; cut -c1-200 "$REQUESTS" >&2; }
  exit 1
}

# ---- 1. Build ---------------------------------------------------------------
if [ "${SMOKE_WEB_BUILD:-1}" = "1" ]; then
  say "building the web bundle"
  npm run build >"$OUT/web-build.log" 2>&1 || { tail -40 "$OUT/web-build.log" >&2; fail "web build failed"; }
  npx cap sync ios >>"$OUT/web-build.log" 2>&1 || { tail -40 "$OUT/web-build.log" >&2; fail "cap sync failed"; }
fi
[ -f ios/App/App/public/index.html ] || fail "no web bundle in ios/App/App/public — run npm run build && npx cap sync ios"
[ -d ios/App/Pods ] || fail "no ios/App/Pods — run (cd ios/App && pod install)"

say "building the app for the simulator ($CONFIGURATION)"
# NOT -sdk iphonesimulator: that forces the embedded Watch target onto the phone SDK.
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration "$CONFIGURATION" \
  -destination "platform=iOS Simulator,name=$DEVICE_TYPE" -derivedDataPath "$DERIVED" \
  CODE_SIGNING_ALLOWED=NO ENABLE_DEBUG_DYLIB=NO build >"$OUT/xcodebuild.log" 2>&1 \
  || { grep -E "error:|BUILD FAILED" "$OUT/xcodebuild.log" | head -30 >&2; fail "xcodebuild failed (log: $OUT/xcodebuild.log)"; }
APP="$DERIVED/Build/Products/$CONFIGURATION-iphonesimulator/App.app"
[ -d "$APP" ] || fail "built app not found at $APP"

# ---- 2. Server + a signed-in session -----------------------------------------
say "starting the hermetic Jellyfin ($E2E_JELLYFIN_NAME on :$E2E_JELLYFIN_PORT)"
bash scripts/e2e-jellyfin.sh up >"$OUT/jellyfin-up.log" 2>&1 \
  || { tail -30 "$OUT/jellyfin-up.log" >&2; fail "e2e-jellyfin up failed"; }
ADMIN_KEY=$(sed -n 's/^JELLYFIN_ADMIN_KEY=//p' "$OUT/jellyfin-up.log" | tail -1)
[ -n "$ADMIN_KEY" ] || fail "e2e-jellyfin printed no JELLYFIN_ADMIN_KEY"
VITE_JELLYFIN_URL="$JF_URL" JELLYFIN_ADMIN_KEY="$ADMIN_KEY" USERNAME_OVERRIDE="$SIM_USER" AREA=ios-sim \
  TEST_PASSWORD="$PASSWORD" bash scripts/ensure-e2e-users.sh
VITE_JELLYFIN_URL="$JF_URL" TEST_USERNAME="$SIM_USER" TEST_PASSWORD="$PASSWORD" bash scripts/seed-e2e-user.sh

CLIENT="MediaBrowser Client=\"Cadence\", Device=\"ios-smoke\", DeviceId=\"$SMOKE_DEVICE_ID\", Version=\"1\""
AUTH=$(curl -sS --fail-with-body --max-time 30 -X POST "$JF_URL/Users/AuthenticateByName" \
  -H 'Content-Type: application/json' -H "Authorization: $CLIENT" \
  -d "{\"Username\":\"$SIM_USER\",\"Pw\":\"$PASSWORD\"}") || fail "sign-in as $SIM_USER failed: $AUTH"
SESSION=$(printf '%s' "$AUTH" | python3 -c 'import sys,json; a=json.load(sys.stdin); u=a["User"]; print(json.dumps({"token":a["AccessToken"],"userId":u["Id"],"username":u["Name"],"isAdmin":bool(u["Policy"]["IsAdministrator"])}))')
USER_ID=$(printf '%s' "$SESSION" | python3 -c 'import sys,json; print(json.load(sys.stdin)["userId"])')

say "starting the recording proxy on :$PROXY_PORT → $JF_URL"
python3 scripts/ios-smoke-proxy.py "$PROXY_PORT" "$JF_URL" "$REQUESTS" &
PROXY_PID=$!
for _ in $(seq 1 50); do curl -sf --max-time 2 "$APP_URL/System/Info/Public" >/dev/null && break; sleep 0.2; done
curl -sf --max-time 5 "$APP_URL/System/Info/Public" >/dev/null || fail "proxy never answered on $APP_URL"
: >"$REQUESTS" # forget the readiness probe

# ---- 3. Simulator: fresh device, install, seed Preferences, launch ------------
say "creating simulator $SIM_NAME ($DEVICE_TYPE)"
UDID=$(xcrun simctl create "$SIM_NAME" "$DEVICE_TYPE") || fail "simctl create failed"
xcrun simctl boot "$UDID"
xcrun simctl bootstatus "$UDID" -b >/dev/null || fail "simulator never finished booting"
xcrun simctl install "$UDID" "$APP" || fail "simctl install failed"
# Capacitor Preferences on iOS = UserDefaults, keys prefixed "CapacitorStorage.".
prefs() { xcrun simctl spawn "$UDID" defaults write "$BUNDLE_ID" "CapacitorStorage.$1" -string "$2"; }
prefs cadence.session "$SESSION"
prefs cadence.device-id "$SMOKE_DEVICE_ID"
prefs cadence.server-url "$APP_URL"

STARTED=$(date '+%Y-%m-%d %H:%M:%S')
LAUNCH_EPOCH=$(date +%s)
LAUNCH=$(xcrun simctl launch --terminate-running-process --stdout="$OUT/app.stdout" --stderr="$OUT/app.stdout" \
  "$UDID" "$BUNDLE_ID") || fail "simctl launch failed: $LAUNCH"
APP_PID=${LAUNCH##*: }
say "launched $BUNDLE_ID (pid $APP_PID)"

# ---- 4. Wait for Home to render real data ------------------------------------
check_home() { # exit 0 = Home painted; prints what is still missing otherwise
  python3 - "$REQUESTS" "$SMOKE_DEVICE_ID" "$USER_ID" <<'PY'
import json, sys
log, device, user = sys.argv[1:4]
reqs = [json.loads(l) for l in open(log) if l.strip()]
mine = [r for r in reqs if r["device"] == device]
latest = [r for r in mine if r["method"] == "GET" and r["path"] == f"/Users/{user}/Items/Latest" and r["status"] == 200 and r["ids"]]
albums = {i for r in latest for i in r["ids"]}
# <img> loads carry the token in the query string, not a DeviceId header.
art = [r for r in reqs if r["method"] == "GET" and r["status"] == 200 and r["path"].endswith("/Images/Primary")
       and r["path"].split("/")[2] in albums]
if not mine:
    sys.exit(print(f"no request from DeviceId {device} yet ({len(reqs)} total)") or 1)
if not latest:
    sys.exit(print("Home's Recently-added query (/Items/Latest) has not returned albums yet") or 1)
if not art:
    sys.exit(print(f"no album cover from the Recently-added shelf loaded yet ({len(albums)} albums)") or 1)
print(f"{len(mine)} requests from the app; Recently-added returned {len(albums)} albums; "
      f"{len(art)} of their covers loaded (e.g. {art[0]['path']})")
PY
}
until STATUS=$(check_home); do
  kill -0 "$APP_PID" 2>/dev/null || fail "the app process (pid $APP_PID) exited before Home rendered — it did not launch"
  [ $(( $(date +%s) - LAUNCH_EPOCH )) -lt "$TIMEOUT" ] || fail "Home did not render within ${TIMEOUT}s: $STATUS"
  sleep 2
done
say "Home rendered: $STATUS"

# ---- 5. Still alive, no scene fault, no crash ---------------------------------
while [ $(( $(date +%s) - LAUNCH_EPOCH )) -lt "$ALIVE" ]; do sleep 1; done
kill -0 "$APP_PID" 2>/dev/null || fail "the app died within ${ALIVE}s of launch"
collect
if grep -q "UIScene life cycle is required" "$OUT/device.log"; then
  fail "UIKit refused the app: 'UIScene life cycle is required for apps built with this SDK'"
fi
CRASHES=$(find "$HOME/Library/Logs/DiagnosticReports" -name 'App*.ips' -newermt "$STARTED" -print0 2>/dev/null \
  | xargs -0 grep -l "\"bundleID\":\"$BUNDLE_ID\"\|\"$BUNDLE_ID\"" 2>/dev/null || true)
[ -z "$CRASHES" ] || fail "crash report(s) for $BUNDLE_ID since launch: $CRASHES"
say "PASS — launched, Home rendered real data, alive after ${ALIVE}s, no scene fault or crash"
