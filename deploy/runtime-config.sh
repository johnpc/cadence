#!/bin/sh
# Write the runtime config the app reads (window.__CADENCE_CONFIG__) from env
# at container startup — so optional settings like SIGNUP_URL can be set per
# deployment WITHOUT rebuilding the image. nginx:alpine runs every executable
# in /docker-entrypoint.d/ before starting nginx, so this lands here.
#
# SIGNUP_URL (optional): when set, the sign-in screen shows a "Sign up" link.
# Unset → an empty config → nothing extra shown.
set -eu

CONFIG_PATH="/usr/share/nginx/html/config.js"

# JSON-escape a value for safe embedding (backslash, quote, control chars).
json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

SIGNUP_URL_JSON=""
if [ -n "${SIGNUP_URL:-}" ]; then
  SIGNUP_URL_JSON="\"signupUrl\":\"$(json_escape "$SIGNUP_URL")\""
fi

cat > "$CONFIG_PATH" <<EOF
window.__CADENCE_CONFIG__ = {${SIGNUP_URL_JSON}};
EOF

echo "cadence: wrote runtime config (SIGNUP_URL ${SIGNUP_URL:+set}${SIGNUP_URL:-unset})"
