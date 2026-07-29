/**
 * Music Grabber config — the self-hosted service that grabs a SINGLE track not
 * yet in the Jellyfin library (downloads FLAC into the same library Cadence
 * reads, then triggers a rescan). A base URL + API key, persisted per-device and
 * overridable in Settings, mirroring marlinStore. OFF by default: with no URL
 * the Grab feature is hidden entirely.
 *
 * SECURITY: the key ships in the client PWA bundle, so it is NOT a strong secret
 * — it only gates casual/anonymous access at the proxy (an accepted tradeoff).
 * Never treat it as sensitive; it's stored on-device like the marlin token.
 */
import { Preferences } from '@capacitor/preferences';

const URL_KEY = 'cadence.music-grabber-url';
const APIKEY_KEY = 'cadence.music-grabber-key';

const trim = (url: string): string => {
  const t = url.trim().replace(/\/+$/, '');
  if (!t) return '';
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
};

/** Build-time defaults (optional): a maintainer image can ship these. */
const BUILD_DEFAULT_URL = trim(import.meta.env.VITE_MUSIC_GRABBER_URL || '');
const BUILD_DEFAULT_KEY = (import.meta.env.VITE_MUSIC_GRABBER_API_KEY || '').trim();

let cachedUrl: string | null = null;
let cachedKey: string | null = null;

function readUrl(): string {
  try {
    const stored = localStorage.getItem(URL_KEY);
    return stored !== null ? trim(stored) : BUILD_DEFAULT_URL;
  } catch {
    return BUILD_DEFAULT_URL;
  }
}

function readKey(): string {
  try {
    const stored = localStorage.getItem(APIKEY_KEY);
    return stored !== null ? stored.trim() : BUILD_DEFAULT_KEY;
  } catch {
    return BUILD_DEFAULT_KEY;
  }
}

/** Seed caches from durable Preferences at startup (mirrors marlinStore). */
export async function hydrateMusicGrabber(): Promise<void> {
  try {
    const [u, k] = await Promise.all([
      Preferences.get({ key: URL_KEY }),
      Preferences.get({ key: APIKEY_KEY }),
    ]);
    cachedUrl = u.value !== null ? trim(u.value) : readUrl();
    cachedKey = k.value !== null ? k.value.trim() : readKey();
  } catch {
    cachedUrl = readUrl();
    cachedKey = readKey();
  }
}

export function getMusicGrabberUrl(): string {
  if (cachedUrl === null) cachedUrl = readUrl();
  return cachedUrl;
}

export function getMusicGrabberKey(): string {
  if (cachedKey === null) cachedKey = readKey();
  return cachedKey;
}

/** The Grab feature is available only once a base URL is configured. */
export function musicGrabberConfigured(): boolean {
  return getMusicGrabberUrl().length > 0;
}

/** Persist the user's URL + key (durable Preferences + sync mirror). Empty
 * clears it (hides the feature). */
export function setMusicGrabber(url: string, key: string): void {
  cachedUrl = trim(url);
  cachedKey = key.trim();
  try {
    localStorage.setItem(URL_KEY, cachedUrl);
    localStorage.setItem(APIKEY_KEY, cachedKey);
  } catch {
    /* storage unavailable — in-memory values still apply this session */
  }
  void Preferences.set({ key: URL_KEY, value: cachedUrl }).catch(() => undefined);
  void Preferences.set({ key: APIKEY_KEY, value: cachedKey }).catch(() => undefined);
}
