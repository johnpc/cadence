import { describe, expect, it, vi } from 'vitest';

vi.mock('./navidromeFetch', () => ({ request: vi.fn() }));
vi.mock('./navidromePlaylistLists', () => ({
  getPlaylists: vi.fn().mockResolvedValue([]),
  getPublicPlaylists: vi.fn().mockResolvedValue([]),
}));

import { request } from './navidromeFetch';
import { getPlaylists, getPublicPlaylists } from './navidromePlaylistLists';
import { searchMedia, searchPlaylists, navidromeSearchSource } from './navidromeSearch';

const mockedRequest = vi.mocked(request);

describe('navidromeSearch', () => {
  it('searchMedia queries search3 once and maps song/album/artist', async () => {
    mockedRequest.mockResolvedValue({
      searchResult3: {
        song: [{ id: 's1', title: 'A Song' }],
        album: [{ id: 'al1', name: 'An Album' }],
        artist: [{ id: 'ar1', name: 'An Artist' }],
      },
    });
    const results = await searchMedia('love', 40);
    expect(request).toHaveBeenCalledWith('/search3', {
      params: { query: 'love', songCount: 40, albumCount: 10, artistCount: 10 },
    });
    expect(results.map((r) => r.Type).sort()).toEqual(['Audio', 'MusicAlbum', 'MusicArtist']);
  });

  it('searchMedia defaults missing arrays to no results for that kind', async () => {
    mockedRequest.mockResolvedValue({ searchResult3: {} });
    expect(await searchMedia('x')).toEqual([]);
  });

  it('searchPlaylists filters own + public playlists by name, case-insensitively', async () => {
    vi.mocked(getPlaylists).mockResolvedValue([
      { Id: 'p1', Name: 'Cadence Test Mix', Type: 'Playlist' },
      { Id: 'p2', Name: 'Other', Type: 'Playlist' },
    ]);
    vi.mocked(getPublicPlaylists).mockResolvedValue([
      { Id: 'p3', Name: 'a cadence community mix', Type: 'Playlist' },
    ]);
    const results = await searchPlaylists('cadence');
    expect(results.map((r) => r.Id).sort()).toEqual(['p1', 'p3']);
  });

  it('searchPlaylists respects the limit', async () => {
    vi.mocked(getPlaylists).mockResolvedValue([
      { Id: 'p1', Name: 'love 1', Type: 'Playlist' },
      { Id: 'p2', Name: 'love 2', Type: 'Playlist' },
    ]);
    vi.mocked(getPublicPlaylists).mockResolvedValue([]);
    expect(await searchPlaylists('love', 1)).toHaveLength(1);
  });

  it('navidromeSearchSource merges media + playlists', async () => {
    mockedRequest.mockResolvedValue({
      searchResult3: { song: [{ id: 's1', title: 'A Song' }] },
    });
    vi.mocked(getPlaylists).mockResolvedValue([{ Id: 'p1', Name: 'love mix', Type: 'Playlist' }]);
    vi.mocked(getPublicPlaylists).mockResolvedValue([]);
    const results = await navidromeSearchSource('love', 40);
    expect(results.map((r) => r.Id).sort()).toEqual(['p1', 's1']);
  });
});
