import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// A shared fake Preferences store (durable path) so we can assert the URL is
// written to / read from Capacitor Preferences, not just localStorage.
const prefs = new Map<string, string>();
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(async ({ key }: { key: string }) => ({ value: prefs.get(key) ?? null })),
    set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
      prefs.set(key, value);
    }),
    remove: vi.fn(async ({ key }: { key: string }) => {
      prefs.delete(key);
    }),
  },
}));

// The store caches the URL in a module-scoped var, so reset modules per test to
// get a fresh cache; re-import after clearing storage.
async function freshStore() {
  vi.resetModules();
  return import('./serverUrlStore');
}

beforeEach(() => {
  localStorage.clear();
  prefs.clear();
});
afterEach(() => {
  localStorage.clear();
  prefs.clear();
});

describe('serverUrlStore', () => {
  it('falls back to the build-time default when nothing is stored', async () => {
    const { getServerUrl } = await freshStore();
    expect(getServerUrl().endsWith('/')).toBe(false);
  });

  it('persists a chosen URL to BOTH localStorage and Preferences (durable)', async () => {
    const { setServerUrl, getServerUrl } = await freshStore();
    setServerUrl('https://jf.example.com/');
    expect(getServerUrl()).toBe('https://jf.example.com');
    expect(localStorage.getItem('cadence.server-url')).toBe('https://jf.example.com');
    // Wait a microtask for the fire-and-forget Preferences.set to settle.
    await Promise.resolve();
    expect(prefs.get('cadence.server-url')).toBe('https://jf.example.com');
  });

  it('trims whitespace and multiple trailing slashes', async () => {
    const { setServerUrl, getServerUrl } = await freshStore();
    setServerUrl('  https://jf.example.com///  ');
    expect(getServerUrl()).toBe('https://jf.example.com');
  });

  it('reads a previously-stored URL from localStorage on a fresh load', async () => {
    localStorage.setItem('cadence.server-url', 'https://stored.example.com');
    const { getServerUrl } = await freshStore();
    expect(getServerUrl()).toBe('https://stored.example.com');
  });

  // The regression the PR #102 review asked for: on native, the Preferences-
  // backed session survives a relaunch but the localStorage mirror is wiped.
  // hydrateServerUrl() must restore the chosen server from Preferences BEFORE
  // the token is validated — else it'd hit the build default / empty server.
  it('hydrates the server URL from Preferences when localStorage is empty', async () => {
    prefs.set('cadence.server-url', 'https://durable.example.com');
    const { hydrateServerUrl, getServerUrl } = await freshStore();
    expect(localStorage.getItem('cadence.server-url')).toBeNull();
    await hydrateServerUrl();
    expect(getServerUrl()).toBe('https://durable.example.com');
  });

  it('hydrate falls back to the localStorage mirror when Preferences is empty', async () => {
    localStorage.setItem('cadence.server-url', 'https://mirror.example.com');
    const { hydrateServerUrl, getServerUrl } = await freshStore();
    await hydrateServerUrl();
    expect(getServerUrl()).toBe('https://mirror.example.com');
  });

  it('hasServerUrl reflects whether a usable URL is configured', async () => {
    const { hasServerUrl } = await freshStore();
    expect(hasServerUrl()).toBe(true);
  });
});
