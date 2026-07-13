import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Control the marlin config from tests (the selector reads these).
const marlin = { url: '', token: '', configured: false };
vi.mock('../../lib/marlinStore', () => ({
  getMarlinUrl: () => marlin.url,
  getMarlinToken: () => marlin.token,
  marlinConfigured: () => marlin.configured,
}));

import { jellyfinSearchSource, marlinSearchSource, searchSource } from './searchSource';
import { setSession } from '../../lib/sessionStore';

beforeEach(() => {
  marlin.url = '';
  marlin.token = '';
  marlin.configured = false;
});

describe('jellyfinSearchSource', () => {
  afterEach(() => {
    setSession(null);
    vi.restoreAllMocks();
  });

  it('queries /Items (songs+albums), /Artists, and playlists, merging + tagging artists', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = vi.fn().mockImplementation((url: string) => {
      let items: unknown[];
      if (url.includes('/Artists')) {
        items = [{ Id: 'ar', Name: 'An Artist' }]; // no Type from the Artists endpoint
      } else if (url.includes('IncludeItemTypes=Playlist')) {
        items = [{ Id: 'pl', Name: 'A Playlist', Type: 'Playlist' }];
      } else {
        items = [
          { Id: 's', Name: 'Song', Type: 'Audio' },
          { Id: 'al', Name: 'Album', Type: 'MusicAlbum' },
        ];
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ Items: items }),
      } as Response);
    });
    vi.stubGlobal('fetch', f);

    const results = await jellyfinSearchSource('love', 10);

    const urls = f.mock.calls.map((c) => c[0] as string);
    expect(urls.some((u) => u.includes('/Items?') && u.includes('IncludeItemTypes=Audio'))).toBe(
      true,
    );
    expect(urls.some((u) => u.includes('/Artists?'))).toBe(true);
    expect(urls.some((u) => u.includes('IncludeItemTypes=Playlist'))).toBe(true);
    // Artists get tagged so the grouping can find them.
    expect(results.find((r) => r.Id === 'ar')?.Type).toBe('MusicArtist');
    expect(results.map((r) => r.Type).sort()).toEqual([
      'Audio',
      'MusicAlbum',
      'MusicArtist',
      'Playlist',
    ]);
  });
});

describe('marlinSearchSource', () => {
  afterEach(() => {
    setSession(null);
    vi.restoreAllMocks();
  });

  it('calls the configured indexer with the token, then hydrates the ids', async () => {
    setSession({ token: 't', userId: 'uid' });
    marlin.url = 'https://search.example.com';
    marlin.token = 'tok';
    const f = vi.fn().mockImplementation((url: string) => {
      const items = url.includes('/search?')
        ? undefined
        : [
            { Id: 'b', Name: 'B', Type: 'Audio' },
            { Id: 'a', Name: 'A', Type: 'MusicAlbum' },
          ];
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ ids: ['a', 'b'] }),
        text: async () => JSON.stringify({ Items: items }),
      } as Response);
    });
    vi.stubGlobal('fetch', f);

    const results = await marlinSearchSource('love', 40);
    const searchCall = f.mock.calls.find((c) => (c[0] as string).includes('/search?'));
    expect(searchCall?.[0]).toBe('https://search.example.com/search?q=love');
    expect((searchCall?.[1] as RequestInit).headers).toMatchObject({ Authorization: 'tok' });
    // getItemsByIds preserves the marlin id order (a, b).
    expect(results.map((r) => r.Id)).toEqual(['a', 'b']);
  });
});

describe('searchSource (active selector)', () => {
  afterEach(() => {
    setSession(null);
    vi.restoreAllMocks();
  });

  it('uses native search when marlin is not configured (default)', async () => {
    setSession({ token: 't', userId: 'uid' });
    marlin.configured = false;
    const f = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ Items: [] }),
    } as Response);
    vi.stubGlobal('fetch', f);
    await searchSource('x', 10);
    // Native fan-out hits /Artists; marlin would hit /search.
    expect(f.mock.calls.some((c) => (c[0] as string).includes('/Artists'))).toBe(true);
    expect(f.mock.calls.some((c) => (c[0] as string).includes('/search?q='))).toBe(false);
  });

  it('falls back to native search when the configured marlin call fails', async () => {
    setSession({ token: 't', userId: 'uid' });
    marlin.configured = true;
    marlin.url = 'https://search.example.com';
    const f = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/search?')) return Promise.resolve({ ok: false, status: 502 } as Response);
      return Promise.resolve({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ Items: [{ Id: 's', Name: 'S', Type: 'Audio' }] }),
      } as Response);
    });
    vi.stubGlobal('fetch', f);
    const results = await searchSource('x', 10);
    // Marlin 502 → native fan-out ran and returned results.
    expect(f.mock.calls.some((c) => (c[0] as string).includes('/Artists'))).toBe(true);
    expect(results.some((r) => r.Id === 's')).toBe(true);
  });
});
