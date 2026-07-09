// Runtime configuration, overwritten at container startup by the entrypoint
// (deploy/runtime-config.sh) from environment variables. This default is empty
// so a plain `npm run dev` or an image run with no env vars set behaves as if
// nothing is configured (e.g. no sign-up link on the login screen).
window.__CADENCE_CONFIG__ = {};
