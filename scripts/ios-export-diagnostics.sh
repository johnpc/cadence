#!/usr/bin/env bash
# Print WHY an `xcodebuild archive` / `-exportArchive` (App Store upload) failed.
#
#   scripts/ios-export-diagnostics.sh <marker-file>
#
# xcodebuild's own output on an export failure is often just
#   "error: the following command failed with exit code 0 but produced no further output"
# (that line ALSO appears in successful runs — it is noise) followed by a non-zero
# exit. The real cause lives in two places this prints, limited to files newer than
# <marker-file> (touch it before the archive):
#   1. the *.xcdistributionlogs bundle(s) IDEDistribution wrote in the user temp dir
#      (critical log in full, the standard log's error lines, the ContentDelivery tail), and
#   2. any xcodebuild crash report — e.g. the AppSSO SIGTRAP
#      (_xpc_api_misuse in xpc_connection_set_target_uid) that kills the upload when
#      the runner user has no GUI login session on the Mac mini.
# Diagnostic only: it never changes the step's outcome.
set -uo pipefail
MARKER="${1:?usage: ios-export-diagnostics.sh <marker-file>}"

echo "== session: console user '$(stat -f %Su /dev/console)', runner user '$(id -un)';" \
  "GUI domain gui/$(id -u): $(launchctl print "gui/$(id -u)" >/dev/null 2>&1 && echo present || echo ABSENT)"

TMP_DIR="$(getconf DARWIN_USER_TEMP_DIR)"
found=0
while IFS= read -r bundle; do
  found=1
  echo "== distribution logs: $bundle"
  for f in IDEDistribution.critical.log; do
    [ -s "$bundle/$f" ] && { echo "---- $f"; cat "$bundle/$f"; }
  done
  # The standard log is mostly context-chain dumps; only its error lines matter.
  [ -s "$bundle/IDEDistribution.standard.log" ] && { echo "---- IDEDistribution.standard.log (error lines)"
    grep -iE "error|fail|denied|invalid|unable|not found" "$bundle/IDEDistribution.standard.log" | grep -v '^\s*<' | tail -40; }
  for f in ContentDelivery.log IDEDistributionAppStoreConnect.log; do
    [ -s "$bundle/$f" ] && { echo "---- $f (last 40 lines)"; tail -40 "$bundle/$f"; }
  done
done < <(find "$TMP_DIR" -maxdepth 1 -name '*.xcdistributionlogs' -newer "$MARKER" 2>/dev/null)
[ "$found" = 1 ] || echo "== no .xcdistributionlogs bundle written since the marker (in $TMP_DIR)"

found=0
while IFS= read -r ips; do
  found=1
  echo "== xcodebuild crash report: $ips"
  python3 - "$ips" <<'PY'
import json, sys
head, body = open(sys.argv[1]).read().split("\n", 1)
b = json.loads(body)
print("exception:", b.get("exception"), "| termination:", (b.get("termination") or {}).get("indicator"))
th = b["threads"][b["faultingThread"]]
print("faulting queue:", th.get("queue"))
for fr in th["frames"][:14]:
    print("   ", b["usedImages"][fr["imageIndex"]].get("name"), fr.get("symbol"))
PY
done < <(find "$HOME/Library/Logs/DiagnosticReports" /Library/Logs/DiagnosticReports -maxdepth 1 \
  -name 'xcodebuild*.ips' -newer "$MARKER" 2>/dev/null)
[ "$found" = 1 ] || echo "== no xcodebuild crash report since the marker"
