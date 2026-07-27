import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Control the marlin config from tests (the source reads these).
const marlin = { url: '', token: '' };
vi.mock('../../lib/marlinStore', () => ({
  getMarlinUrl: () => marlin.url,
  getMarlinToken: () => marlin.token,
}));
vi.mock('../../lib/navidromeItemsByIds', () => ({
  getSongsByIds: vi.fn().mockResolvedValue([]),
  getAlbumsByIds: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../lib/navidromeArtists', () => ({ getArtistsByIds: vi.fn().mockResolvedValue([]) }));
vi.mock('../../lib/navidromeSearch', () => ({ searchPlaylists: vi.fn().mockResolvedValue([]) }));

import { getSongsByIds, getAlbumsByIds } from '../../lib/navidromeItemsByIds';
import { getArtistsByIds } from '../../lib/navidromeArtists';
import { searchPlaylists } from '../../lib/navidromeSearch';
import { marlinSearchSource } from './marlinSource';

beforeEach(() => {
  marlin.url = '';
  marlin.token = '';
  vi.mocked(getSongsByIds).mockResolvedValue([]);
  vi.mocked(getAlbumsByIds).mockResolvedValue([]);
  vi.mocked(getArtistsByIds).mockResolvedValue([]);
  vi.mocked(searchPlaylists).mockResolvedValue([]);
});

// marlin is queried PER type; each single-type /search returns that type's ids,
// which get routed to the matching kind-specific hydrator.
function stubMarlin(opts: { perType: Record<string, string[]>; proxy?: boolean; fails?: boolean }) {
  const searchPath = opts.proxy ? '/api/search' : '/search?';
  const f = vi.fn().mockImplementation((url: string) => {
    if (opts.fails) return Promise.resolve({ ok: false, status: 502 } as Response);
    if (url.includes(searchPath)) {
      const type = new URL(url, 'http://x').searchParams.get('includeItemTypes') ?? '';
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ ids: opts.perType[type] ?? [] }),
      } as Response);
    }
    return Promise.reject(new Error(`unexpected fetch: ${url}`));
  });
  vi.stubGlobal('fetch', f);
  return f;
}

describe('marlinSearchSource', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    delete window.__CADENCE_CONFIG__;
  });

  it('queries marlin per type and hydrates each via its own kind-specific fetcher', async () => {
    marlin.url = 'https://search.example.com';
    marlin.token = 'tok';
    const f = stubMarlin({
      perType: { Audio: ['s1'], MusicAlbum: ['al1'], MusicArtist: ['ar1'] },
    });
    vi.mocked(getSongsByIds).mockResolvedValue([{ Id: 's1', Name: 'Song', Type: 'Audio' }]);
    vi.mocked(getAlbumsByIds).mockResolvedValue([{ Id: 'al1', Name: 'Album', Type: 'MusicAlbum' }]);
    vi.mocked(getArtistsByIds).mockResolvedValue([
      { Id: 'ar1', Name: 'Artist', Type: 'MusicArtist' },
    ]);

    const results = await marlinSearchSource('love', 40);

    const searchUrls = f.mock.calls
      .map((c) => c[0] as string)
      .filter((u) => u.includes('/search?'));
    expect(searchUrls.some((u) => u.includes('includeItemTypes=Audio'))).toBe(true);
    expect(searchUrls.some((u) => u.includes('includeItemTypes=MusicAlbum'))).toBe(true);
    expect(searchUrls.some((u) => u.includes('includeItemTypes=MusicArtist'))).toBe(true);
    const marlinCall = f.mock.calls.find((c) => (c[0] as string).includes('/search?'));
    expect((marlinCall?.[1] as RequestInit).headers).toMatchObject({ Authorization: 'tok' });
    expect(getSongsByIds).toHaveBeenCalledWith(['s1']);
    expect(getAlbumsByIds).toHaveBeenCalledWith(['al1']);
    expect(getArtistsByIds).toHaveBeenCalledWith(['ar1']);
    expect(results.map((r) => r.Id).sort()).toEqual(['al1', 'ar1', 's1']);
  });

  it('uses the same-origin /api/search proxy with NO token when marlinProxy is on', async () => {
    window.__CADENCE_CONFIG__ = { marlinProxy: true };
    const f = stubMarlin({ proxy: true, perType: { Audio: ['a'] } });
    vi.mocked(getSongsByIds).mockResolvedValue([{ Id: 'a', Name: 'A', Type: 'Audio' }]);

    const results = await marlinSearchSource('love', 40);
    const call = f.mock.calls.find((c) => (c[0] as string).includes('/api/search'));
    expect((call?.[0] as string).startsWith('/api/search')).toBe(true); // same-origin, no host
    expect((call?.[1] as RequestInit | undefined)?.headers).toBeUndefined();
    expect(results.map((r) => r.Id)).toEqual(['a']);
  });

  it('fetches playlists via the native name-filter (marlin cannot rank them) and merges them', async () => {
    marlin.url = 'https://search.example.com';
    stubMarlin({ perType: { Audio: ['song'] } });
    vi.mocked(getSongsByIds).mockResolvedValue([{ Id: 'song', Name: 'A Song', Type: 'Audio' }]);
    vi.mocked(searchPlaylists).mockResolvedValue([
      { Id: 'pl', Name: 'Cadence Test Mix', Type: 'Playlist' },
    ]);

    const results = await marlinSearchSource('Cadence', 40);
    expect(searchPlaylists).toHaveBeenCalledWith('Cadence', 10);
    expect(results.find((r) => r.Type === 'Playlist')?.Name).toBe('Cadence Test Mix');
  });

  it('still returns marlin music even if the native playlist fetch fails', async () => {
    marlin.url = 'https://search.example.com';
    stubMarlin({ perType: { Audio: ['song'] } });
    vi.mocked(getSongsByIds).mockResolvedValue([{ Id: 'song', Name: 'A Song', Type: 'Audio' }]);
    vi.mocked(searchPlaylists).mockRejectedValue(new Error('playlist fetch failed'));

    const results = await marlinSearchSource('love', 40);
    expect(results.map((r) => r.Id)).toEqual(['song']);
  });

  it('throws (letting the selector fall back) when a marlin type query fails', async () => {
    marlin.url = 'https://search.example.com';
    stubMarlin({ perType: {}, fails: true });
    await expect(marlinSearchSource('love', 40)).rejects.toThrow();
  });
});
