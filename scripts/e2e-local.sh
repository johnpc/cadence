#!/usr/bin/env bash
# Run one acceptance area (or all of them) against the hermetic Jellyfin — the
# same thing CI does, on your machine:
#
#   scripts/e2e-local.sh search            # one area
#   scripts/e2e-local.sh all               # every area, serially
#   SLOWMO=400 scripts/e2e-local.sh playback   # watch it in a visible browser
#
# Brings the container up (idempotent, ~15 s cold), seeds the area's user, then
# runs Playwright for that area with the exact env the CI matrix uses. Needs
# docker. Leaves the server running for the next run; `scripts/e2e-jellyfin.sh
# down` removes it.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AREA="${1:?usage: e2e-local.sh <area>|all}"

eval "$(bash "$HERE/e2e-jellyfin.sh" up | grep -E '^[A-Z_0-9]+=' | sed 's/^/export /')"

run_area() {
  local area=$1
  export TEST_USERNAME="cadence-e2e-${area}" E2E_DEVICE_ID="cadence-e2e-${area}"
  bash "$HERE/seed-e2e-user.sh" | sed 's/^/  /'
  npx bddgen
  # workers=1 like CI: scenarios in an area share and mutate one user's state.
  npx playwright test ".features-gen/e2e/features/${area}" --workers=1 "${@:2}"
}

if [ "$AREA" = all ]; then
  for a in $(ls "$HERE/../e2e/features"); do
    [ -d "$HERE/../e2e/features/$a" ] || continue
    echo "=== $a"; run_area "$a" || echo "=== $a FAILED"
  done
else
  run_area "$AREA"
fi
