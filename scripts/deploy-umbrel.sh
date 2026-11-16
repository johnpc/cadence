#!/usr/bin/env bash
# Deploy cadence.jpc.io from the repo's deploy/compose.yaml — the ONLY compose
# for this stack. The server holds just a `.env` of deployment values.
#
#   scripts/deploy-umbrel.sh check          # read-only: does the live stack match the repo?
#   scripts/deploy-umbrel.sh install        # adopt the repo compose (no restart): moves any
#                                           # value typed into the live compose into .env,
#                                           # proves the rendered config is IDENTICAL, swaps
#   scripts/deploy-umbrel.sh deploy <tag>   # run image tag <tag> (e.g. sha-2e4e180), then verify
#
# Why: the live compose used to be hand-maintained inside Dockge and drifted
# from the repo (it was still documenting a local-build flow the server no
# longer used). Now drift is impossible by construction, and `check` proves it.
#
# Needs: ssh to umbrel@$UMBREL_HOST (LAN), sudo there. Secrets never leave the
# server: values are read and written server-side and never printed.
set -euo pipefail

HOST="${UMBREL_HOST:-umbrel@192.168.7.211}"
STACK=cadence
HOST_DIR="/home/umbrel/umbrel/app-data/dockge/data/dockge-stacks/$STACK" # = /opt/stacks/$STACK in dind
DIND_DIR="/opt/stacks/$STACK"
PUBLIC_URL="${CADENCE_PUBLIC_URL:-https://cadence.jpc.io}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_COMPOSE="$HERE/../deploy/compose.yaml"

remote() { ssh -o BatchMode=yes "$HOST" "$@"; }
dc() { echo "sudo docker exec dockge_dockge_1 docker compose -p $STACK --project-directory $DIND_DIR $*"; }
die() { echo "deploy-umbrel: $*" >&2; exit 1; }

# Render a compose file against the stack's .env (as JSON, keys sorted).
render() { remote "$(dc -f "$DIND_DIR/$1" config --format json) | python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin), indent=1, sort_keys=True))'"; }

upload_candidate() {
  remote "sudo tee $HOST_DIR/compose.candidate.yaml >/dev/null" <"$REPO_COMPOSE"
}

check() {
  upload_candidate
  local live candidate
  live=$(render compose.yaml)
  candidate=$(render compose.candidate.yaml)
  remote "sudo rm -f $HOST_DIR/compose.candidate.yaml"
  if [ "$live" = "$candidate" ]; then
    echo "deploy-umbrel: live stack == deploy/compose.yaml (+ server .env)"
    if remote "sudo cmp -s $HOST_DIR/compose.yaml -" <"$REPO_COMPOSE"; then
      echo "deploy-umbrel: and the live compose file IS the repo file"
    else
      echo "deploy-umbrel: the live compose FILE differs from the repo (run: install)"; return 2
    fi
  else
    echo "deploy-umbrel: DRIFT — the live stack renders differently from the repo compose:" >&2
    diff <(echo "$live") <(echo "$candidate") | sed -E 's/("[A-Z_]*(TOKEN|KEY)[A-Z_]*": )".*"/\1"<redacted>"/' >&2 || true
    return 1
  fi
}

# Copy every environment value + the image tag the LIVE stack runs with into
# .env (keys already in .env win), so the repo compose renders identically.
adopt_env() {
  remote "sudo python3 - '$HOST_DIR'" <<'PY'
import json, subprocess, sys, pathlib
d = pathlib.Path(sys.argv[1])
cfg = json.loads(subprocess.check_output(
    ["docker", "exec", "dockge_dockge_1", "docker", "compose", "-p", "cadence",
     "--project-directory", "/opt/stacks/cadence", "-f", "/opt/stacks/cadence/compose.yaml",
     "config", "--format", "json"]))
svc = cfg["services"]["cadence"]
env_path = d / ".env"
lines = env_path.read_text().splitlines() if env_path.exists() else []
have = {l.split("=", 1)[0] for l in lines if "=" in l and not l.startswith("#")}
wanted = dict(svc.get("environment") or {})
wanted["CADENCE_TAG"] = svc["image"].rsplit(":", 1)[1]
added = [k for k in sorted(wanted) if k not in have and wanted[k] not in (None, "")]
lines += [f"{k}={wanted[k]}" for k in added]
env_path.write_text("\n".join(lines) + "\n")
env_path.chmod(0o600)
print("deploy-umbrel: .env now also holds: " + (", ".join(added) or "(nothing new)"))
PY
}

install() {
  adopt_env
  check && { echo "deploy-umbrel: already adopted"; return 0; } || [ $? -eq 2 ] || die "rendered config would change — refusing to swap (see diff)"
  remote "sudo cp $HOST_DIR/compose.yaml $HOST_DIR/compose.yaml.bak-\$(date +%Y%m%d%H%M%S) && sudo tee $HOST_DIR/compose.yaml >/dev/null" <"$REPO_COMPOSE"
  check || die "post-swap check failed — restore the .bak file"
  echo "deploy-umbrel: adopted the repo compose with no change to the running container"
}

verify() {
  local cfg bundle
  cfg=$(curl -fsS --max-time 20 "$PUBLIC_URL/config.js")
  echo "deploy-umbrel: config.js → $(echo "$cfg" | grep -o 'serverUrl[^,}]*' | head -1)"
  bundle=$(curl -fsS --max-time 20 "$PUBLIC_URL/" | grep -o '/assets/index-[^"]*\.js' | head -1)
  [ -n "$bundle" ] || die "could not find the entry bundle at $PUBLIC_URL"
  local host
  host=$(echo "$cfg" | grep -o 'https\?://[^"/]*' | head -1 | sed 's#https\?://##')
  if [ -n "$host" ] && curl -fsS --max-time 30 "$PUBLIC_URL$bundle" | grep -q "$host"; then
    die "the bundle contains the server hostname — it must come from runtime config only"
  fi
  echo "deploy-umbrel: bundle $bundle is server-agnostic"
}

deploy() {
  local tag="${1:?usage: deploy <tag>}"
  check >/dev/null || [ $? -eq 2 ] || die "live stack has drifted — run check/install first"
  remote "sudo cmp -s $HOST_DIR/compose.yaml -" <"$REPO_COMPOSE" || die "live compose is not the repo file — run install first"
  remote "sudo sed -i -E 's/^CADENCE_TAG=.*/CADENCE_TAG=$tag/' $HOST_DIR/.env && grep -q '^CADENCE_TAG=' $HOST_DIR/.env || echo 'CADENCE_TAG=$tag' | sudo tee -a $HOST_DIR/.env >/dev/null"
  remote "$(dc -f "$DIND_DIR/compose.yaml" pull) && $(dc -f "$DIND_DIR/compose.yaml" up -d)"
  remote "sudo docker exec dockge_dockge_1 docker inspect cadence --format '{{.Config.Image}} {{.State.Status}}'"
  verify
}

case "${1:-}" in
  check) check ;;
  install) install ;;
  deploy) deploy "${2:-}" ;;
  verify) verify ;;
  *) die "usage: $0 check|install|deploy <tag>|verify" ;;
esac
