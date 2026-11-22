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
  /** When true, the CadenceConfig Jellyfin plugin's Lidarr proxy
   * (`/Cadence/Lidarr/*`: signed-in users only, allowlisted endpoints, key kept
   * server-side) is available. Set from the plugin config (pluginConfigStore).
   * Enables the "request missing music" feature on web and native. */
  lidarrProxy?: boolean;
  /** When true, the CadenceConfig Jellyfin plugin exposes the Deezer playlist
   * import endpoint (POST /Cadence/Deezer/Import). Set by the plugin-config fetch
   * (pluginConfigStore); gates the "Import from Deezer" screen. */
  deezerImport?: boolean;
  /** When true, the CadenceConfig Jellyfin plugin bridges to a Storyteller
   * server (`/Cadence/Storyteller/*`): karaoke-style read-along text for
   * audiobooks and a shared listening/reading position. Set by the plugin-config
   * fetch (pluginConfigStore); gates the "Read along" button and the Settings
   * "Storyteller" card. */
  storyteller?: boolean;
}

/** The boolean-valued keys of RuntimeConfig — the set of plugin/deploy feature
 * flags. Derived so it self-maintains as flags are added (see runtimeConfig's
 * configFlag), rather than a hand-kept union that drifts. */
export type BooleanFlag = {
  [K in keyof RuntimeConfig]-?: RuntimeConfig[K] extends boolean | undefined ? K : never;
}[keyof RuntimeConfig];

declare global {
  interface Window {
    __CADENCE_CONFIG__?: RuntimeConfig;
    /** Set by the e2e harness (before app boot) to disable Ionic route/gesture
     * animations, so transitions are instant and deterministic under test. */
    __CADENCE_E2E__?: boolean;
  }
}
