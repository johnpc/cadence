import { beforeEach, describe, expect, it, vi } from 'vitest';

// The iOS app: the SecureSession (Keychain) plugin is registered natively.
const keychain = {
  value: null as string | null,
  failNextGet: false,
  broken: false,
  brokenWrite: false,
};
const prefs = new Map<string, string>();
vi.mock('@capacitor/core', () => ({
  Capacitor: { isPluginAvailable: (name: string) => name === 'SecureSession' },
  registerPlugin: () => ({
    get: vi.fn(async () => {
      if (keychain.broken)
        throw Object.assign(new Error('keychain read failed (-34018)'), { code: 'unavailable' });
      if (keychain.failNextGet) {
        keychain.failNextGet = false;
        throw Object.assign(new Error('keychain read failed (-25308)'), { code: 'locked' });
      }
      return { value: keychain.value };
    }),
    set: vi.fn(async ({ value }: { value: string }) => {
      if (keychain.broken || keychain.brokenWrite)
        throw Object.assign(new Error('keychain write failed (-34018)'), { code: 'unavailable' });
      keychain.value = value;
    }),
    remove: vi.fn(async () => {
      keychain.value = null;
    }),
  }),
}));
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(async ({ key }: { key: string }) => ({ value: prefs.get(key) ?? null })),
    set: vi.fn(
      async ({ key, value }: { key: string; value: string }) => void prefs.set(key, value),
    ),
    remove: vi.fn(async ({ key }: { key: string }) => void prefs.delete(key)),
  },
}));

import {
  __resetKeychainState,
  clearStoredSession,
  loadStoredSession,
  storeSession,
} from './sessionPersistence';

const session = { token: 't', userId: 'u', username: 'john' };

describe('sessionPersistence on iOS (Keychain)', () => {
  beforeEach(() => {
    keychain.value = null;
    keychain.failNextGet = false;
    keychain.broken = false;
    keychain.brokenWrite = false;
    prefs.clear();
    __resetKeychainState();
  });

  it('stores in the Keychain, not Preferences', async () => {
    await storeSession(session);
    expect(JSON.parse(keychain.value ?? '{}')).toEqual(session);
    expect(prefs.has('cadence.session')).toBe(false);
    expect(await loadStoredSession()).toEqual(session);
  });

  it('moves a session saved by an older build out of Preferences, once', async () => {
    prefs.set('cadence.session', JSON.stringify(session));
    expect(await loadStoredSession()).toEqual(session);
    expect(JSON.parse(keychain.value ?? '{}')).toEqual(session);
    expect(prefs.has('cadence.session')).toBe(false);
  });

  it('returns null with nothing anywhere, and ignores a corrupt legacy value', async () => {
    expect(await loadStoredSession()).toBeNull();
    prefs.set('cadence.session', 'not json');
    expect(await loadStoredSession()).toBeNull();
    expect(keychain.value).toBeNull();
  });

  it('an unusable Keychain falls back to Preferences — the app never hangs on launch', async () => {
    keychain.broken = true;
    prefs.set('cadence.session', JSON.stringify(session));
    expect(await loadStoredSession()).toEqual(session); // still signed in
    expect(prefs.has('cadence.session')).toBe(true); // nothing lost
    await storeSession({ ...session, token: 't2' });
    expect(JSON.parse(prefs.get('cadence.session') ?? '{}').token).toBe('t2');
    await expect(clearStoredSession()).resolves.toBeUndefined();
  });

  it('keeps the Preferences copy if migrating it into the Keychain fails', async () => {
    prefs.set('cadence.session', JSON.stringify(session));
    keychain.brokenWrite = true; // the read works (empty), the write fails
    expect(await loadStoredSession()).toEqual(session);
    expect(prefs.has('cadence.session')).toBe(true);
    expect(keychain.value).toBeNull();
  });

  it('a LOCKED Keychain throws (so launch retries) instead of signing out', async () => {
    keychain.value = JSON.stringify(session);
    keychain.failNextGet = true;
    await expect(loadStoredSession()).rejects.toThrow('keychain read failed');
  });

  it('sign-out clears the Keychain and any leftover Preferences copy', async () => {
    keychain.value = JSON.stringify(session);
    prefs.set('cadence.session', JSON.stringify(session));
    await clearStoredSession();
    expect(keychain.value).toBeNull();
    expect(prefs.has('cadence.session')).toBe(false);
  });
});
