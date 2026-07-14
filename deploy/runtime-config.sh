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
#                  When set (with MARLIN_TOKEN), nginx proxies same-origin
#                  /api/search to it and injects the token server-side, and the
#                  app uses that instead of Jellyfin's native search fan-out. The
#                  token NEVER reaches the browser. Off (native search) when unset.
#   MARLIN_TOKEN — the indexer's EXPRESS_AUTH_TOKEN, injected by nginx (not shipped
#                  to the client).
#   LIDARR_URL   — Lidarr base URL (e.g. http://192.168.7.211:8686). When set (with
#                  LIDARR_API_KEY), nginx proxies same-origin /api/lidarr/* to a
#                  CURATED ALLOWLIST of Lidarr endpoints (search / add / status /
#                  profiles), injecting the API key server-side. Enables the
#                  "request missing music" (Lidarr) feature. Off when unset.
#   LIDARR_API_KEY — Lidarr's API key. A WRITE credential (add/delete artists,
#                  trigger downloads) — so it is injected by nginx and NEVER shipped
#                  to the client, and only the allowlisted read/add paths are
#                  reachable (no delete/config endpoints), even through the proxy.
set -eu

CONFIG_PATH="/usr/share/nginx/html/config.js"
MARLIN_CONF="/etc/nginx/cadence/marlin.conf"
LIDARR_CONF="/etc/nginx/cadence/lidarr.conf"

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
# when both URL + token are set (a URL without its token would 401 every search).
mkdir -p "$(dirname "$MARLIN_CONF")"
if [ -n "${MARLIN_URL:-}" ] && [ -n "${MARLIN_TOKEN:-}" ]; then
  # Strip any trailing slash so "$MARLIN_URL/search" is well-formed.
  MU="$(printf '%s' "$MARLIN_URL" | sed 's#/*$##')"
  cat > "$MARLIN_CONF" <<EOF
# Generated at container start by runtime-config.sh — do not edit.
location = /api/search {
  proxy_pass ${MU}/search\$is_args\$args;
  proxy_set_header Authorization "${MARLIN_TOKEN}";
  proxy_set_header Host \$proxy_host;
}
EOF
  [ -z "$FIELDS" ] || FIELDS="$FIELDS,"
  FIELDS="$FIELDS\"marlinProxy\":true"
  echo "cadence: marlin proxy ENABLED → ${MU}/search (token injected server-side)"
else
  # Empty include so nginx boots and /api/search 404s (client falls back).
  : > "$MARLIN_CONF"
fi

# Same-origin Lidarr proxy for "request missing music". CURATED ALLOWLIST only:
# the injected key has full write access to the library manager, so we expose
# just the read/add paths the feature needs and NOTHING that could delete the
# library or change config. Each location rewrites /api/lidarr/X → LIDARR/api/v1/X
# and injects X-Api-Key server-side. GET everywhere except the add endpoints.
mkdir -p "$(dirname "$LIDARR_CONF")"
if [ -n "${LIDARR_URL:-}" ] && [ -n "${LIDARR_API_KEY:-}" ]; then
  LU="$(printf '%s' "$LIDARR_URL" | sed 's#/*$##')"
  cat > "$LIDARR_CONF" <<EOF
# Generated at container start by runtime-config.sh — do not edit.
# Read-only lookups (search MusicBrainz, list profiles/root folders, poll status)
# and the add endpoints (POST artist/album). Blanket passthrough is deliberately
# avoided so delete/command/config endpoints stay unreachable. A regex location
# enforces the allowlist; a `rewrite` maps /api/lidarr/X → /api/v1/X and the
# proxy_pass upstream is STATIC (host only) so nginx needs no DNS resolver — the
# request URI carries the path. \$proxy_host is set so Lidarr sees a valid Host.
location ~ ^/api/lidarr/(search|qualityprofile|metadataprofile|rootfolder|queue|artist|album)(/.*)?\$ {
  limit_except GET POST { deny all; }
  rewrite ^/api/lidarr/(.*)\$ /api/v1/\$1 break;
  proxy_pass ${LU};
  proxy_set_header X-Api-Key "${LIDARR_API_KEY}";
  proxy_set_header Host \$proxy_host;
}
EOF
  [ -z "$FIELDS" ] || FIELDS="$FIELDS,"
  FIELDS="$FIELDS\"lidarrProxy\":true"
  echo "cadence: lidarr proxy ENABLED → ${LU}/api/v1 (key injected server-side, allowlisted paths)"
else
  : > "$LIDARR_CONF"
fi

cat > "$CONFIG_PATH" <<EOF
window.__CADENCE_CONFIG__ = {${FIELDS}};
EOF

echo "cadence: wrote runtime config (SIGNUP_URL ${SIGNUP_URL:+set}${SIGNUP_URL:-unset}, JELLYFIN_URL ${JELLYFIN_URL:+set}${JELLYFIN_URL:-unset}, MARLIN ${MARLIN_URL:+set}${MARLIN_URL:-unset}, LIDARR ${LIDARR_URL:+set}${LIDARR_URL:-unset})"
