/**
 * Durable persistence of the signed-in Jellyfin session (token + userId +
 * username).
 *
 * - **iOS app:** the Keychain, via the app-local `SecureSession` plugin
 *   (ios/App/App/SecureSessionPlugin.swift) — not Capacitor Preferences, which is
 *   plain UserDefaults and lands in unencrypted backups. A session saved by an
 *   older build in Preferences is moved into the Keychain the first time it's
 *   read, then deleted from Preferences.
 * - **Web / PWA (and anything without the plugin):** Capacitor Preferences, which
 *   is localStorage-backed there.
 *
 * Keychain failures: `locked` (the device hasn't been unlocked since boot) is
 * transient — it throws, so resolveSession retries and reports `loading`, never
 * a false sign-out. Anything else (`unavailable`, e.g. a build without the
 * Keychain entitlement) falls back to Preferences for the rest of the run, so
 * the app can never hang on its loading screen.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import type { Session } from './jellyfinTypes';

const KEY = 'cadence.session';

export interface StoredSession extends Session {
  username: string;
}

interface SecureSessionPlugin {
  get(): Promise<{ value: string | null }>;
  set(options: { value: string }): Promise<void>;
  remove(): Promise<void>;
}

const SecureSession = registerPlugin<SecureSessionPlugin>('SecureSession');

let keychainUnavailable = false;

/** True in the iOS app (the plugin is registered natively there) unless the
 * Keychain has proven unusable this run. */
const keychainEnabled = (): boolean =>
  !keychainUnavailable && Capacitor.isPluginAvailable('SecureSession');

/** Run a Keychain call; on anything but a transient lock, stop using the
 * Keychain this run and let the caller fall back to Preferences. */
async function keychain<T>(
  call: () => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false }> {
  try {
    return { ok: true, value: await call() };
  } catch (e) {
    if ((e as { code?: string }).code === 'locked') throw e;
    keychainUnavailable = true;
    return { ok: false };
  }
}

/** Test-only: forget a previous run's Keychain failure. */
export function __resetKeychainState(): void {
  keychainUnavailable = false;
}

const fromPreferences = async (): Promise<StoredSession | null> =>
  parse((await Preferences.get({ key: KEY })).value);

function parse(value: string | null | undefined): StoredSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as StoredSession;
    if (parsed.token && parsed.userId) return parsed;
  } catch {
    // Corrupt value — treat as no session.
  }
  return null;
}

/** Move a session saved by an older build out of Preferences into the Keychain. */
async function migrateFromPreferences(): Promise<StoredSession | null> {
  const { value } = await Preferences.get({ key: KEY });
  const legacy = parse(value);
  // Only drop the Preferences copy once the Keychain really holds it.
  if (legacy && value && (await keychain(() => SecureSession.set({ value }))).ok) {
    await Preferences.remove({ key: KEY });
  }
  return legacy;
}

export async function loadStoredSession(): Promise<StoredSession | null> {
  if (!keychainEnabled()) return fromPreferences();
  const read = await keychain(() => SecureSession.get());
  if (!read.ok) return fromPreferences();
  return parse(read.value.value) ?? migrateFromPreferences();
}

export async function storeSession(session: StoredSession): Promise<void> {
  const value = JSON.stringify(session);
  if (keychainEnabled() && (await keychain(() => SecureSession.set({ value }))).ok) return;
  await Preferences.set({ key: KEY, value });
}

export async function clearStoredSession(): Promise<void> {
  if (keychainEnabled()) await keychain(() => SecureSession.remove());
  // Always clear Preferences too: it may hold a pre-Keychain copy.
  await Preferences.remove({ key: KEY });
}
