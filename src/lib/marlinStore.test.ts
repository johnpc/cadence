import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prefs = new Map<string, string>();
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(async ({ key }: { key: string }) => ({ value: prefs.get(key) ?? null })),
    set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
      prefs.set(key, value);
    }),
  },
}));

// Module-scoped cache → fresh import per test.
async function fresh() {
  vi.resetModules();
  return import('./marlinStore');
}

beforeEach(() => {
  localStorage.clear();
  prefs.clear();
  delete window.__CADENCE_CONFIG__;
  vi.stubEnv('VITE_MARLIN_URL', '');
});
afterEach(() => {
  localStorage.clear();
  prefs.clear();
  delete window.__CADENCE_CONFIG__;
  vi.unstubAllEnvs();
});

describe('marlinStore', () => {
  it('is OFF by default — no URL configured, native search stays', async () => {
    const { getMarlinUrl, marlinConfigured } = await fresh();
    expect(getMarlinUrl()).toBe('');
    expect(marlinConfigured()).toBe(false);
  });

  it('uses the runtime-config default URL when set (no user choice yet)', async () => {
    window.__CADENCE_CONFIG__ = { marlinUrl: 'https://search.example.com/' };
    const { getMarlinUrl, marlinConfigured } = await fresh();
    expect(getMarlinUrl()).toBe('https://search.example.com');
    expect(marlinConfigured()).toBe(true);
  });

  it('persists a user URL + token to localStorage AND Preferences', async () => {
    const { setMarlin, getMarlinUrl, getMarlinToken, marlinConfigured } = await fresh();
    setMarlin('search.example.com', 'tok123');
    expect(getMarlinUrl()).toBe('https://search.example.com'); // scheme added, slash trimmed
    expect(getMarlinToken()).toBe('tok123');
    expect(marlinConfigured()).toBe(true);
    expect(localStorage.getItem('cadence.marlin-url')).toBe('https://search.example.com');
    await Promise.resolve();
    expect(prefs.get('cadence.marlin-url')).toBe('https://search.example.com');
    expect(prefs.get('cadence.marlin-token')).toBe('tok123');
  });

  it('clearing the URL turns marlin back off', async () => {
    const { setMarlin, marlinConfigured } = await fresh();
    setMarlin('https://s.example.com', 't');
    expect(marlinConfigured()).toBe(true);
    setMarlin('', '');
    expect(marlinConfigured()).toBe(false);
  });

  it('hydrates the cache from durable Preferences at startup', async () => {
    prefs.set('cadence.marlin-url', 'https://durable.example.com');
    prefs.set('cadence.marlin-token', 'dtok');
    const { hydrateMarlin, getMarlinUrl, getMarlinToken } = await fresh();
    await hydrateMarlin();
    expect(getMarlinUrl()).toBe('https://durable.example.com');
    expect(getMarlinToken()).toBe('dtok');
  });

  it('a server-managed URL SUPERSEDES the user’s stored choice', async () => {
    // User previously set their own URL...
    const first = await fresh();
    first.setMarlin('https://user-choice.example.com', 'usertok');
    // ...then the server (plugin/config.js) provides one — it wins.
    window.__CADENCE_CONFIG__ = { marlinUrl: 'https://server-managed.example.com' };
    const { getMarlinUrl, marlinManagedByServer } = await fresh();
    // rehydrate the user value into the fresh module's Preferences-backed cache
    prefs.set('cadence.marlin-url', 'https://user-choice.example.com');
    expect(getMarlinUrl()).toBe('https://server-managed.example.com');
    expect(marlinManagedByServer()).toBe(true);
  });

  it('marlinManagedByServer is false when no server URL is configured', async () => {
    const { marlinManagedByServer } = await fresh();
    expect(marlinManagedByServer()).toBe(false);
  });

  it('marlinManagedByServer is true when the same-origin proxy is enabled (web, no URL)', async () => {
    window.__CADENCE_CONFIG__ = { marlinProxy: true };
    const { marlinManagedByServer } = await fresh();
    expect(marlinManagedByServer()).toBe(true);
  });
});
