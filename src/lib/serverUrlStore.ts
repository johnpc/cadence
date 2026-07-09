/**
 * The Jellyfin server base URL, chosen at sign-in and persisted per-device.
 * Runtime-configurable (not a build-time constant) so one build can point at
 * ANY Jellyfin server — the prerequisite for a self-hostable public image.
 * VITE_JELLYFIN_URL, when set at build time, is only the initial default.
 */
const KEY = 'cadence.server-url';

const trim = (url: string): string => url.trim().replace(/\/+$/, '');

/** The build-time default (the maintainer's server), or '' for a generic image. */
const DEFAULT_URL = trim(import.meta.env.VITE_JELLYFIN_URL || '');

let cached: string | null = null;

/** The active base URL: the stored choice, else the build-time default. Cached
 * so the hot `apiUrl()` path doesn't hit localStorage on every request. */
export function getServerUrl(): string {
  if (cached !== null) return cached;
  try {
    const stored = localStorage.getItem(KEY);
    cached = stored ? trim(stored) : DEFAULT_URL;
  } catch {
    cached = DEFAULT_URL;
  }
  return cached;
}

/** Persist the user's chosen server URL (normalised, trailing slashes removed). */
export function setServerUrl(url: string): void {
  cached = trim(url);
  try {
    localStorage.setItem(KEY, cached);
  } catch {
    /* storage unavailable — the in-memory value still applies this session */
  }
}

/** Whether a usable server URL is configured (stored or built-in default). */
export function hasServerUrl(): boolean {
  return getServerUrl().length > 0;
}
