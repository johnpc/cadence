/**
 * The Jellyfin server base URL, chosen at sign-in and persisted per-device.
 * Runtime-configurable (not a build-time constant) so one build can point at
 * ANY Jellyfin server — the prerequisite for a self-hostable public image.
 * VITE_JELLYFIN_URL, when set at build time, is only the initial default.
 *
 * Persisted via @capacitor/preferences (like the session + device id) so it
 * survives native relaunches — iOS WKWebView localStorage is NOT durable, so a
 * localStorage-only URL could be lost while the Preferences-backed session
 * survives, leaving resolveSession() validating the token against the wrong
 * server. A sync localStorage mirror keeps the hot apiUrl() path cheap;
 * hydrateServerUrl() seeds the cache from Preferences at startup.
 */
import { Preferences } from '@capacitor/preferences';

const KEY = 'cadence.server-url';

const trim = (url: string): string => url.trim().replace(/\/+$/, '');

/** The build-time default (the maintainer's server), or '' for a generic image. */
const DEFAULT_URL = trim(import.meta.env.VITE_JELLYFIN_URL || '');

let cached: string | null = null;

function readSync(): string {
  try {
    const stored = localStorage.getItem(KEY);
    return stored ? trim(stored) : DEFAULT_URL;
  } catch {
    return DEFAULT_URL;
  }
}

/** Seed the in-memory cache from durable storage (Preferences), falling back to
 * the localStorage mirror then the build default. Call once at startup BEFORE
 * validating a restored session, so the token is checked against the server the
 * user actually signed into. */
export async function hydrateServerUrl(): Promise<void> {
  try {
    const { value } = await Preferences.get({ key: KEY });
    if (value) {
      cached = trim(value);
      return;
    }
  } catch {
    /* Preferences unavailable — fall through to the sync sources */
  }
  cached = readSync();
}

/** The active base URL: the stored choice, else the build-time default. Cached
 * so the hot apiUrl() path doesn't hit storage on every request. */
export function getServerUrl(): string {
  if (cached !== null) return cached;
  cached = readSync();
  return cached;
}

/** Persist the user's chosen server URL (normalised, trailing slashes removed)
 * to both the durable Preferences store and the sync localStorage mirror. */
export function setServerUrl(url: string): void {
  cached = trim(url);
  try {
    localStorage.setItem(KEY, cached);
  } catch {
    /* storage unavailable — the in-memory value still applies this session */
  }
  void Preferences.set({ key: KEY, value: cached }).catch(() => undefined);
}

/** Whether a usable server URL is configured (stored or built-in default). */
export function hasServerUrl(): boolean {
  return getServerUrl().length > 0;
}
