/**
 * Optional marlin-search (Meilisearch) config for faster search — a base URL +
 * auth token, persisted per-device. OFF by default (native Jellyfin search until
 * configured). A server-managed URL (runtime config.js / the CadenceConfig
 * plugin) SUPERSEDES the user's choice — see getMarlinUrl / marlinManagedByServer.
 * The token is stored on-device via Preferences, never baked into the build.
 */
import { Preferences } from '@capacitor/preferences';
import { configuredMarlinUrl } from './runtimeConfig';

const URL_KEY = 'cadence.marlin-url';
const TOKEN_KEY = 'cadence.marlin-token';

const trim = (url: string): string => {
  const t = url.trim().replace(/\/+$/, '');
  if (!t) return '';
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
};

/** Build-time default (optional): a maintainer image can ship a default URL. */
const BUILD_DEFAULT_URL = trim(import.meta.env.VITE_MARLIN_URL || '');

let cachedUrl: string | null = null;
let cachedToken: string | null = null;

/** The user's own choice (localStorage) else the build default — the fallback
 * when the server isn't managing the URL (that's applied in getMarlinUrl). */
function readUrl(): string {
  try {
    const stored = localStorage.getItem(URL_KEY);
    return stored !== null ? trim(stored) : BUILD_DEFAULT_URL;
  } catch {
    return BUILD_DEFAULT_URL;
  }
}

function readToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

/** Seed caches from durable Preferences at startup (mirrors serverUrlStore). */
export async function hydrateMarlin(): Promise<void> {
  try {
    const [u, t] = await Promise.all([
      Preferences.get({ key: URL_KEY }),
      Preferences.get({ key: TOKEN_KEY }),
    ]);
    cachedUrl = u.value !== null ? trim(u.value) : readUrl();
    cachedToken = t.value ?? readToken();
  } catch {
    cachedUrl = readUrl();
    cachedToken = readToken();
  }
}

/** True when the server (runtime config.js or the CadenceConfig plugin) has set
 * the marlin URL. When so it SUPERSEDES the user's Settings choice and the
 * Settings field is shown read-only — the admin has made this decision. */
export function marlinManagedByServer(): boolean {
  return configuredMarlinUrl() !== null;
}

export function getMarlinUrl(): string {
  // A server-managed URL wins over the user's stored value. Read it live (not
  // just at hydrate) since the plugin fetch fills it in after startup.
  const managed = configuredMarlinUrl();
  if (managed) return trim(managed);
  if (cachedUrl === null) cachedUrl = readUrl();
  return cachedUrl;
}

export function getMarlinToken(): string {
  if (cachedToken === null) cachedToken = readToken();
  return cachedToken;
}

/** Marlin is used only when a base URL is configured. */
export function marlinConfigured(): boolean {
  return getMarlinUrl().length > 0;
}

/** Persist the user's marlin URL + token (both to durable Preferences + sync
 * mirror). Empty values clear it (back to native search). */
export function setMarlin(url: string, token: string): void {
  cachedUrl = trim(url);
  cachedToken = token.trim();
  try {
    localStorage.setItem(URL_KEY, cachedUrl);
    localStorage.setItem(TOKEN_KEY, cachedToken);
  } catch {
    /* storage unavailable — in-memory values still apply this session */
  }
  void Preferences.set({ key: URL_KEY, value: cachedUrl }).catch(() => undefined);
  void Preferences.set({ key: TOKEN_KEY, value: cachedToken }).catch(() => undefined);
}
