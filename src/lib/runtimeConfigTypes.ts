/**
 * Shape of the runtime configuration injected at container startup
 * (window.__CADENCE_CONFIG__, written by deploy/runtime-config.sh from env, or
 * merged from the CadenceConfig Jellyfin plugin at sign-in) — NOT baked into the
 * build. Everything is optional; readers (see runtimeConfig.ts) must tolerate a
 * missing config.js.
 */
export interface RuntimeConfig {
  /** Optional sign-up URL — when set, the sign-in screen shows a "Sign up" link
   * (e.g. an invite/registration page for the server operator's Jellyfin). */
  signupUrl?: string;
  /** Optional default Jellyfin server URL — pre-fills the sign-in Server field
   * so a self-hoster can pin their server without rebuilding the image. The
   * user can still override it; a saved choice takes precedence. */
  serverUrl?: string;
  /** Optional Google Cast receiver application id. When set, casting uses this
   * custom receiver (which renders the visualizer/lyrics/queue on the TV)
   * instead of the default media receiver. Unset → default receiver (audio
   * only). Registered in the Google Cast console; see receiver/README. */
  castReceiverAppId?: string;
  /** Optional default marlin-search (Meilisearch) base URL for faster search.
   * A per-deploy default the user can override in Settings; unset → native
   * Jellyfin search until the user configures a URL themselves. The token is
   * NOT here — it's entered/stored on-device (see marlinStore). */
  marlinUrl?: string;
  /** When true, the serving nginx proxies `/api/search` to the marlin indexer
   * and injects the auth token SERVER-SIDE (see deploy/runtime-config.sh). The
   * client then searches the same-origin `/api/search` with NO token in the
   * browser and no direct indexer exposure — the preferred setup. Web/PWA only
   * (native has no nginx; config.js is absent there, so this stays false). */
  marlinProxy?: boolean;
  /** When true, the serving nginx proxies `/api/lidarr/*` to Lidarr (a curated
   * allowlist), injecting the API key SERVER-SIDE (see deploy/runtime-config.sh).
   * Enables the "request missing music" feature. The write-capable key never
   * reaches the browser. Web/PWA only (config.js absent on native → false). */
  lidarrProxy?: boolean;
  /** When true, the Lidarr proxy is provided by the CadenceConfig Jellyfin plugin
   * (GET|POST /Cadence/Lidarr/*), not the serving nginx. Set by the plugin-config
   * fetch (pluginConfigStore) when nginx didn't already enable lidarrProxy — so
   * lidarrApi routes through Jellyfin (works on native iOS, which has no nginx). */
  lidarrPluginProxy?: boolean;
}

declare global {
  interface Window {
    __CADENCE_CONFIG__?: RuntimeConfig;
    /** Set by the e2e harness (before app boot) to disable Ionic route/gesture
     * animations, so transitions are instant and deterministic under test. */
    __CADENCE_E2E__?: boolean;
  }
}
