#!/bin/sh
# Write the runtime config the app reads (window.__CADENCE_CONFIG__) from env at
# container startup — so optional settings can be set per deployment WITHOUT
# rebuilding the image. nginx:alpine runs every executable in
# /docker-entrypoint.d/ before starting nginx, so this lands here.
#
# Supported env (all optional; unset → omitted → app default):
#   SIGNUP_URL   — show a "Sign up" link on the sign-in screen.
#   JELLYFIN_URL — default Jellyfin server URL (pre-fills the Server field; the
#                  user can still override, and a saved choice wins).
#   CAST_RECEIVER_APP_ID — custom Google Cast receiver app id; enables the
#                  visualizer/lyrics/queue-on-TV receiver (see receiver/README).
#   MARLIN_URL   — marlin-search indexer base URL (e.g. http://192.168.7.211:5000).
#                  When set (with MARLIN_TOKEN AND JELLYFIN_URL), nginx proxies
#                  same-origin /api/search to it and injects the token
#                  server-side, and the app uses that instead of Jellyfin's native
#                  search fan-out. The token NEVER reaches the browser, and the
#                  proxy is SIGNED-IN ONLY: every request is first checked against
#                  Jellyfin (GET /Users/Me with the caller's own Authorization
#                  header) and refused with 401 unless the token is valid. Without
#                  JELLYFIN_URL there is nothing to verify against, so the proxy
#                  stays off (fail closed) and the app uses native search.
#   MARLIN_TOKEN — the indexer's EXPRESS_AUTH_TOKEN, injected by nginx (not shipped
#                  to the client).
#
# Lidarr "request missing music" is NOT proxied here any more: an nginx proxy
# injecting Lidarr's write key had no sign-in check, so anyone on the internet
# could add artists. The app now always uses the CadenceConfig Jellyfin plugin's
# /Cadence/Lidarr proxy, which requires a signed-in Jellyfin user and allowlists
# the Lidarr endpoints. LIDARR_URL / LIDARR_API_KEY are ignored.
set -eu

CONFIG_PATH="/usr/share/nginx/html/config.js"
MARLIN_CONF="/etc/nginx/cadence/marlin.conf"

# JSON-escape a value for safe embedding (backslash, quote).
json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

# Append "key":"value" (comma-separated) to $FIELDS when $2 is non-empty.
FIELDS=""
add_field() {
  [ -n "$2" ] || return 0
  [ -z "$FIELDS" ] || FIELDS="$FIELDS,"
  FIELDS="$FIELDS\"$1\":\"$(json_escape "$2")\""
}

add_field signupUrl "${SIGNUP_URL:-}"
add_field serverUrl "${JELLYFIN_URL:-}"
add_field castReceiverAppId "${CAST_RECEIVER_APP_ID:-}"

# Same-origin marlin proxy: write the nginx snippet + flag config.js, but ONLY
# when the URL + token are set (a URL without its token would 401 every search)
# AND there is a Jellyfin to check callers against (no gate → no proxy).
mkdir -p "$(dirname "$MARLIN_CONF")"
if [ -n "${MARLIN_URL:-}" ] && [ -n "${MARLIN_TOKEN:-}" ] && [ -n "${JELLYFIN_URL:-}" ]; then
  # Strip any trailing slash so "$MARLIN_URL/search" is well-formed.
  MU="$(printf '%s' "$MARLIN_URL" | sed 's#/*$##')"
  JU="$(printf '%s' "$JELLYFIN_URL" | sed 's#/*$##')"
  # Resolve upstream hostnames at REQUEST time with the container's own DNS
  # server: a static hostname is resolved once at boot, so a DNS blip during a
  # restart would stop nginx from starting at all (the whole site down).
  NS="$(awk '/^nameserver/ { print $2; exit }' /etc/resolv.conf)"
  case "$NS" in *:*) NS="[$NS]" ;; esac
  cat > "$MARLIN_CONF" <<EOF
# Generated at container start by runtime-config.sh — do not edit.
resolver ${NS:-127.0.0.11} valid=30s ipv6=off;
# Sign-in gate: Jellyfin answers /Users/Me with 200 only for a valid token, so
# auth_request admits a search only from a signed-in user. The caller's own
# Authorization header is forwarded; the marlin token is added after the gate.
location = /_cadence_jellyfin_auth {
  internal;
  set \$cadence_jellyfin "${JU}";
  proxy_pass \$cadence_jellyfin/Users/Me;
  proxy_pass_request_body off;
  proxy_set_header Content-Length "";
  proxy_set_header Authorization \$http_authorization;
  proxy_set_header X-Emby-Authorization \$http_x_emby_authorization;
  proxy_ssl_server_name on;
}
location = /api/search {
  auth_request /_cadence_jellyfin_auth;
  set \$cadence_marlin "${MU}";
  proxy_pass \$cadence_marlin/search\$is_args\$args;
  proxy_set_header Authorization "${MARLIN_TOKEN}";
  proxy_set_header X-Emby-Authorization "";
}
EOF
  [ -z "$FIELDS" ] || FIELDS="$FIELDS,"
  FIELDS="$FIELDS\"marlinProxy\":true"
  echo "cadence: marlin proxy ENABLED → ${MU}/search (token injected server-side)"
else
  # Empty include so nginx boots and /api/search 404s (client falls back).
  : > "$MARLIN_CONF"
fi

cat > "$CONFIG_PATH" <<EOF
window.__CADENCE_CONFIG__ = {${FIELDS}};
EOF

echo "cadence: wrote runtime config (SIGNUP_URL ${SIGNUP_URL:+set}${SIGNUP_URL:-unset}, JELLYFIN_URL ${JELLYFIN_URL:+set}${JELLYFIN_URL:-unset}, MARLIN ${MARLIN_URL:+set}${MARLIN_URL:-unset})"
