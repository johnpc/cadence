/**
 * Optional marlin-search (Meilisearch) config for faster search — a base URL +
 * auth token, chosen in Settings and persisted per-device. OFF by default:
 * search stays on Jellyfin's native endpoint until a URL is configured (here or
 * via the per-deploy VITE_MARLIN_URL / runtime marlinUrl default).
 *
 * The token is the USER's own token for THEIR own indexer, stored on-device via
 * Preferences (exactly like the Jellyfin session token) — it is never baked into
 * the committed build or shipped in public client JS. No server address/port is
 * hardcoded anywhere; it comes only from Settings or an env-provided default.
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

/** Default marlin URL when the user hasn't set one: runtime config wins over the
 * build constant; '' (native search) when neither is set. */
function defaultUrl(): string {
  const runtime = configuredMarlinUrl();
  return runtime ? trim(runtime) : BUILD_DEFAULT_URL;
}

let cachedUrl: string | null = null;
let cachedToken: string | null = null;

function readUrl(): string {
  try {
    const stored = localStorage.getItem(URL_KEY);
    return stored !== null ? trim(stored) : defaultUrl();
  } catch {
    return defaultUrl();
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

export function getMarlinUrl(): string {
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
