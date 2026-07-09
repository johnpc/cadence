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
