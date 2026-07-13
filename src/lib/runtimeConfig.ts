/**
 * Runtime configuration injected at container startup (window.__CADENCE_CONFIG__,
 * written by deploy/runtime-config.sh from env) — NOT baked into the build. Lets
 * a self-hoster set optional values like a sign-up URL without rebuilding the
 * image. Everything is optional; readers must tolerate a missing config.js.
 */
interface RuntimeConfig {
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
}

declare global {
  interface Window {
    __CADENCE_CONFIG__?: RuntimeConfig;
  }
}

/** A safe http(s) URL from a runtime-config field, or null when unset/invalid.
 * Rejects non-http(s) schemes (e.g. javascript:) so an injected value can't be
 * an XSS vector. */
function safeHttpUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

/** The runtime sign-up URL, or null when unset/invalid. */
export function signupUrl(): string | null {
  return safeHttpUrl(window.__CADENCE_CONFIG__?.signupUrl);
}

/** The runtime default Jellyfin server URL, or null when unset/invalid. Used as
 * the sign-in default when the user hasn't already chosen a server. Trailing
 * slashes are left for serverUrlStore to normalise. */
export function configuredServerUrl(): string | null {
  return safeHttpUrl(window.__CADENCE_CONFIG__?.serverUrl);
}

/** The configured custom Cast receiver app id, or null when unset/invalid.
 * Google Cast app ids are short alphanumeric tokens (e.g. "A1B2C3D4"); validate
 * the shape so an injected value can't smuggle anything unexpected into the
 * plugin's initialize call. */
export function castReceiverAppId(): string | null {
  const raw = window.__CADENCE_CONFIG__?.castReceiverAppId;
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  return /^[A-Za-z0-9]{4,16}$/.test(t) ? t : null;
}

/** The per-deploy default marlin-search base URL, or null when unset/invalid.
 * Only a default — the user's Settings choice (marlinStore) takes precedence. */
export function configuredMarlinUrl(): string | null {
  return safeHttpUrl(window.__CADENCE_CONFIG__?.marlinUrl);
}

/** True when the deploy has enabled the same-origin `/api/search` marlin proxy
 * (token injected server-side by nginx). The client then uses `/api/search`
 * with no token in the browser. Absent config.js (native app) → false. */
export function marlinProxyEnabled(): boolean {
  return window.__CADENCE_CONFIG__?.marlinProxy === true;
}
