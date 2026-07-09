import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The store caches the URL in a module-scoped var, so reset modules per test to
// get a fresh cache; re-import after clearing localStorage.
async function freshStore() {
  vi.resetModules();
  return import('./serverUrlStore');
}

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe('serverUrlStore', () => {
  it('falls back to the build-time default when nothing is stored', async () => {
    const { getServerUrl } = await freshStore();
    // VITE_JELLYFIN_URL is set in the test env; default is non-empty + slash-free.
    expect(getServerUrl().endsWith('/')).toBe(false);
  });

  it('persists a chosen URL and normalises trailing slashes', async () => {
    const { setServerUrl, getServerUrl } = await freshStore();
    setServerUrl('https://jf.example.com/');
    expect(getServerUrl()).toBe('https://jf.example.com');
    expect(localStorage.getItem('cadence.server-url')).toBe('https://jf.example.com');
  });

  it('trims whitespace and multiple trailing slashes', async () => {
    const { setServerUrl, getServerUrl } = await freshStore();
    setServerUrl('  https://jf.example.com///  ');
    expect(getServerUrl()).toBe('https://jf.example.com');
  });

  it('reads a previously-stored URL on a fresh load', async () => {
    localStorage.setItem('cadence.server-url', 'https://stored.example.com');
    const { getServerUrl } = await freshStore();
    expect(getServerUrl()).toBe('https://stored.example.com');
  });

  it('hasServerUrl reflects whether a usable URL is configured', async () => {
    const { hasServerUrl } = await freshStore();
    expect(hasServerUrl()).toBe(true); // build-time default present in test env
  });
});
