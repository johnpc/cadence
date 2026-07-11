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
set -eu

CONFIG_PATH="/usr/share/nginx/html/config.js"

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

cat > "$CONFIG_PATH" <<EOF
window.__CADENCE_CONFIG__ = {${FIELDS}};
EOF

echo "cadence: wrote runtime config (SIGNUP_URL ${SIGNUP_URL:+set}${SIGNUP_URL:-unset}, JELLYFIN_URL ${JELLYFIN_URL:+set}${JELLYFIN_URL:-unset})"
