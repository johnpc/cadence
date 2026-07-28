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
  return import('./musicGrabberStore');
}

beforeEach(() => {
  localStorage.clear();
  prefs.clear();
  vi.stubEnv('VITE_MUSIC_GRABBER_URL', '');
  vi.stubEnv('VITE_MUSIC_GRABBER_API_KEY', '');
});
afterEach(() => {
  localStorage.clear();
  prefs.clear();
  vi.unstubAllEnvs();
});

describe('musicGrabberStore', () => {
  it('is unconfigured by default (empty URL hides the feature)', async () => {
    const { getMusicGrabberUrl, musicGrabberConfigured } = await fresh();
    expect(getMusicGrabberUrl()).toBe('');
    expect(musicGrabberConfigured()).toBe(false);
  });

  it('uses the build-time env default when set', async () => {
    vi.stubEnv('VITE_MUSIC_GRABBER_URL', 'https://musicgrabber.jpc.io');
    vi.stubEnv('VITE_MUSIC_GRABBER_API_KEY', 'envkey');
    const { getMusicGrabberUrl, getMusicGrabberKey, musicGrabberConfigured } = await fresh();
    expect(getMusicGrabberUrl()).toBe('https://musicgrabber.jpc.io');
    expect(getMusicGrabberKey()).toBe('envkey');
    expect(musicGrabberConfigured()).toBe(true);
  });

  it('persists + reads back a URL and key, normalising the URL', async () => {
    const { setMusicGrabber, getMusicGrabberUrl, getMusicGrabberKey } = await fresh();
    setMusicGrabber('musicgrabber.jpc.io', ' key123 ');
    expect(getMusicGrabberUrl()).toBe('https://musicgrabber.jpc.io');
    expect(getMusicGrabberKey()).toBe('key123');
  });

  it('keeps an explicit http scheme and strips trailing slashes', async () => {
    const { setMusicGrabber, getMusicGrabberUrl } = await fresh();
    setMusicGrabber('http://192.168.1.5:38274/', 'k');
    expect(getMusicGrabberUrl()).toBe('http://192.168.1.5:38274');
  });

  it('clears when set empty', async () => {
    const { setMusicGrabber, musicGrabberConfigured } = await fresh();
    setMusicGrabber('https://x.io', 'k');
    setMusicGrabber('', '');
    expect(musicGrabberConfigured()).toBe(false);
  });
});
