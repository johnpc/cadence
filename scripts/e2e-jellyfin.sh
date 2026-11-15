#!/usr/bin/env bash
# A throwaway Jellyfin for the acceptance suite — hermetic, local, deterministic.
#
#   scripts/e2e-jellyfin.sh up     # start container, generate fixtures, finish the
#                                  # setup wizard, create Music + Books libraries,
#                                  # scan, create every e2e user → prints the env
#   scripts/e2e-jellyfin.sh down   # remove the container (and its data)
#   scripts/e2e-jellyfin.sh env    # print the env block again (for `eval`)
#
# WHY: CI used to hit the maintainer's PRODUCTION Jellyfin through a tunnel —
# 14 parallel areas provisioning users, warming auth and seeding playlists on a
# live server (junk users + sessions, real load, tunnel cold starts, and every
# "gotcha" that came with them). This script replaces all of that with a
# container that boots in ~15 s and holds a fixture library built for the
# scenarios (scripts/e2e-fixtures.sh). Only the `smoke` area still runs against
# a live server — the public demo instance, never production.
#
# Needs: docker, curl, python3. No ffmpeg (fixtures are rendered inside the
# container with jellyfin-ffmpeg). Idempotent: `up` on a running container only
# re-asserts users and prints the env.
set -euo pipefail

IMAGE="${E2E_JELLYFIN_IMAGE:-jellyfin/jellyfin:12.4}"
NAME="${E2E_JELLYFIN_NAME:-cadence-e2e-jellyfin}"
PORT="${E2E_JELLYFIN_PORT:-8196}"
URL="http://localhost:${PORT}"
ADMIN_USER="e2e-admin"
ADMIN_PASS="${E2E_ADMIN_PASSWORD:-cadence-e2e-admin}"
# Not a secret: the server lives for one CI job / one local run and is reachable
# only on localhost.
TEST_PASSWORD="${TEST_PASSWORD:-cadence-e2e-pass}"
# One user per acceptance area (ci.yml matrix) + the second user the playlists
# area's cross-user visibility scenario signs in as.
AREAS=(smoke auth playback search library playlists home album artist song downloads offline audiobooks native-playback playlists2)
EXPECTED_SONGS=46
EXPECTED_BOOK_PARTS=5
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

CLIENT='MediaBrowser Client="cadence-e2e", Device="ci", DeviceId="cadence-e2e-setup", Version="1"'
TOKEN=""
# jf <curl args…> — authenticated JSON call; token added once we have one.
jf() {
  local auth="$CLIENT"; [ -n "$TOKEN" ] && auth="$CLIENT, Token=\"$TOKEN\""
  curl -sS --fail-with-body --max-time 60 -H "Authorization: $auth" -H 'Content-Type: application/json' "$@"
}
py() { python3 -c "$@"; }
die() { echo "e2e-jellyfin: $*" >&2; exit 1; }

wait_for_server() {
  for _ in $(seq 1 90); do
    if curl -sf --max-time 3 "$URL/System/Info/Public" >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  docker logs "$NAME" 2>&1 | tail -20 >&2
  die "server at $URL never answered"
}

wizard_done() {
  curl -sf --max-time 5 "$URL/System/Info/Public" | py 'import sys,json; sys.exit(0 if json.load(sys.stdin).get("StartupWizardCompleted") else 1)'
}

complete_wizard() {
  echo "e2e-jellyfin: completing the setup wizard"
  jf -X POST "$URL/Startup/Configuration" -d '{"UICulture":"en-US","MetadataCountryCode":"US","PreferredMetadataLanguage":"en"}' >/dev/null
  jf "$URL/Startup/User" >/dev/null
  jf -X POST "$URL/Startup/User" -d "$(py 'import json,sys; print(json.dumps({"Name":sys.argv[1],"Password":sys.argv[2]}))' "$ADMIN_USER" "$ADMIN_PASS")" >/dev/null
  jf -X POST "$URL/Startup/RemoteAccess" -d '{"EnableRemoteAccess":true,"EnableAutomaticPortMapping":false}' >/dev/null
  jf -X POST "$URL/Startup/Complete" >/dev/null
}

sign_in_admin() {
  TOKEN=$(jf -X POST "$URL/Users/AuthenticateByName" \
    -d "$(py 'import json,sys; print(json.dumps({"Username":sys.argv[1],"Pw":sys.argv[2]}))' "$ADMIN_USER" "$ADMIN_PASS")" \
    | py 'import sys,json; print(json.load(sys.stdin)["AccessToken"])')
  [ -n "$TOKEN" ] || die "admin sign-in failed"
}

# A library with every internet metadata/image fetcher OFF: the scan stays fast
# and the fixture tags are the only source of truth (no MusicBrainz renames).
library_options() {
  py 'import json,sys
no_fetch = lambda t: {"Type": t, "MetadataFetchers": [], "MetadataFetcherOrder": [], "ImageFetchers": [], "ImageFetcherOrder": [], "ImageOptions": []}
print(json.dumps({"LibraryOptions": {
  "PathInfos": [{"Path": sys.argv[1]}],
  "EnableRealtimeMonitor": False, "SaveLocalMetadata": False, "EnableLUFSScan": False,
  "EnableChapterImageExtraction": False, "ExtractChapterImagesDuringLibraryScan": False,
  "AutomaticRefreshIntervalDays": 0, "EnableEmbeddedTitles": True,
  "TypeOptions": [no_fetch(t) for t in sys.argv[2].split(",")],
}}))' "$1" "$2"
}

create_libraries() {
  local have
  have=$(jf "$URL/Library/VirtualFolders" | py 'import sys,json; print(",".join(v["Name"] for v in json.load(sys.stdin)))')
  if [[ ",$have," != *",Music,"* ]]; then
    echo "e2e-jellyfin: creating the Music library"
    jf -X POST "$URL/Library/VirtualFolders?name=Music&collectionType=music&refreshLibrary=false" \
      -d "$(library_options /media/music MusicArtist,MusicAlbum,Audio)" >/dev/null
  fi
  if [[ ",$have," != *",Books,"* ]]; then
    echo "e2e-jellyfin: creating the Books library"
    jf -X POST "$URL/Library/VirtualFolders?name=Books&collectionType=books&refreshLibrary=false" \
      -d "$(library_options /media/books AudioBook,Book)" >/dev/null
  fi
  jf -X POST "$URL/Library/Refresh" >/dev/null
}

count() { # count <IncludeItemTypes>
  jf "$URL/Items?IncludeItemTypes=$1&Recursive=true&Limit=0" | py 'import sys,json; print(json.load(sys.stdin).get("TotalRecordCount",0))'
}

wait_for_scan() {
  echo "e2e-jellyfin: waiting for the library scan ($EXPECTED_SONGS songs, $EXPECTED_BOOK_PARTS audiobook parts)"
  for _ in $(seq 1 120); do
    local songs books
    songs=$(count Audio); books=$(count AudioBook)
    if [ "$songs" -ge "$EXPECTED_SONGS" ] && [ "$books" -ge "$EXPECTED_BOOK_PARTS" ]; then
      echo "e2e-jellyfin: scanned $songs songs, $books audiobook parts"
      return 0
    fi
    sleep 2
  done
  die "library scan incomplete: $(count Audio) songs, $(count AudioBook) audiobook parts"
}

create_users() {
  for area in "${AREAS[@]}"; do
    VITE_JELLYFIN_URL="$URL" JELLYFIN_ADMIN_KEY="$TOKEN" AREA="$area" TEST_PASSWORD="$TEST_PASSWORD" \
      bash "$HERE/ensure-e2e-users.sh" | sed 's/^/  /'
  done
}

print_env() {
  cat <<ENV
VITE_JELLYFIN_URL=$URL
JELLYFIN_ADMIN_KEY=$TOKEN
TEST_PASSWORD=$TEST_PASSWORD
TEST_PASSWORD_2=$TEST_PASSWORD
TEST_USERNAME_2=cadence-e2e-playlists2
ENV
}

up() {
  if ! docker ps --format '{{.Names}}' | grep -qx "$NAME"; then
    docker rm -f "$NAME" >/dev/null 2>&1 || true
    echo "e2e-jellyfin: starting $IMAGE as $NAME on :$PORT"
    docker run -d --name "$NAME" -p "${PORT}:8096" "$IMAGE" >/dev/null
    echo "e2e-jellyfin: rendering the fixture library inside the container"
    docker cp "$HERE/e2e-fixtures.sh" "$NAME:/tmp/e2e-fixtures.sh"
    docker exec "$NAME" sh /tmp/e2e-fixtures.sh /media
  fi
  wait_for_server
  if ! wizard_done; then complete_wizard; fi
  sign_in_admin
  create_libraries
  wait_for_scan
  create_users
  # GitHub Actions: hand the env to later steps. Locally: `eval "$(… env)"`.
  if [ -n "${GITHUB_ENV:-}" ]; then print_env >> "$GITHUB_ENV"; fi
  print_env
}

case "${1:-}" in
  up) up ;;
  down) docker rm -f "$NAME" >/dev/null 2>&1 && echo "e2e-jellyfin: removed $NAME" || true ;;
  env) wait_for_server; sign_in_admin; print_env ;;
  *) die "usage: $0 up|down|env" ;;
esac
