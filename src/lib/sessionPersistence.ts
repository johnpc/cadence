/**
 * Durable persistence of the signed-in Jellyfin session (token + userId +
 * username). Uses @capacitor/preferences so it survives relaunches on native
 * (UserDefaults / SharedPreferences), where localStorage is not durable in the
 * iOS WKWebView. Web is unaffected (Preferences is localStorage-backed there).
 */
import { Preferences } from '@capacitor/preferences';
import type { Session } from './jellyfinTypes';

const KEY = 'cadence.session';

export interface StoredSession extends Session {
  username: string;
}

export async function loadStoredSession(): Promise<StoredSession | null> {
  const { value } = await Preferences.get({ key: KEY });
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as StoredSession;
    if (parsed.token && parsed.userId) return parsed;
  } catch {
    // Corrupt value — treat as no session.
  }
  return null;
}

export async function storeSession(session: StoredSession): Promise<void> {
  await Preferences.set({ key: KEY, value: JSON.stringify(session) });
}

export async function clearStoredSession(): Promise<void> {
  await Preferences.remove({ key: KEY });
}
