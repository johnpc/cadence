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
}

declare global {
  interface Window {
    __CADENCE_CONFIG__?: RuntimeConfig;
  }
}

/** A safe http(s) sign-up URL from runtime config, or null when unset/invalid.
 * Rejects non-http(s) schemes (e.g. javascript:) so an injected value can't be
 * an XSS vector via the link href. */
export function signupUrl(): string | null {
  const raw = window.__CADENCE_CONFIG__?.signupUrl;
  if (typeof raw !== 'string' || raw.trim() === '') return null;
  try {
    const url = new URL(raw.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}
