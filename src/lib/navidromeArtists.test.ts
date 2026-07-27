import { describe, expect, it, vi } from 'vitest';

vi.mock('./navidromeFetch', () => ({ request: vi.fn() }));

import { request } from './navidromeFetch';
import {
  getArtist,
  getArtistAlbums,
  getFavoriteArtists,
  getArtistsByIds,
  getArtistTopTracks,
  getArtistTracks,
} from './navidromeArtists';

const mockedRequest = vi.mocked(request);

describe('navidromeArtists', () => {
  it('getArtist maps the response to a MediaItem', async () => {
    mockedRequest.mockResolvedValue({ artist: { id: 'ar1', name: 'The Artist' } });
    const artist = await getArtist('ar1');
    expect(request).toHaveBeenCalledWith('/getArtist', { params: { id: 'ar1' } });
    expect(artist).toMatchObject({ Id: 'ar1', Name: 'The Artist', Type: 'MusicArtist' });
  });

  it('getArtistAlbums returns the album[] from getArtist', async () => {
    mockedRequest.mockResolvedValue({
      artist: { id: 'ar1', name: 'x', album: [{ id: 'al1', name: 'An Album' }] },
    });
    const albums = await getArtistAlbums('ar1');
    expect(albums).toEqual([expect.objectContaining({ Id: 'al1', Name: 'An Album' })]);
  });

  it('getFavoriteArtists dedupes by name and sorts alphabetically', async () => {
    mockedRequest.mockResolvedValue({
      starred2: {
        artist: [
          { id: 'b', name: 'Bravo' },
          { id: 'a', name: 'Alpha' },
        ],
      },
    });
    const artists = await getFavoriteArtists();
    expect(artists.map((a) => a.Name)).toEqual(['Alpha', 'Bravo']);
  });

  it('getArtistsByIds hydrates in the given order, dropping missing ones', async () => {
    mockedRequest
      .mockResolvedValueOnce({ artist: { id: 'a', name: 'A' } })
      .mockRejectedValueOnce(new Error('404'));
    expect(await getArtistsByIds(['a', 'missing'])).toEqual([expect.objectContaining({ Id: 'a' })]);
  });

  it('getArtistsByIds returns [] for an empty list without calling request', async () => {
    mockedRequest.mockClear();
    expect(await getArtistsByIds([])).toEqual([]);
    expect(request).not.toHaveBeenCalled();
  });

  it('getArtistTopTracks looks up the artist name, then queries getTopSongs by name', async () => {
    mockedRequest.mockResolvedValueOnce({ artist: { id: 'ar1', name: 'The Artist' } });
    mockedRequest.mockResolvedValueOnce({
      topSongs: { song: [{ id: 's1', title: 'Hit' }] },
    });
    const tracks = await getArtistTopTracks('ar1', 5);
    expect(request).toHaveBeenNthCalledWith(2, '/getTopSongs', {
      params: { artist: 'The Artist', count: 20 },
    });
    expect(tracks).toEqual([expect.objectContaining({ Id: 's1', Name: 'Hit' })]);
  });

  it('getArtistTopTracks dedupes by title and trims to the limit', async () => {
    mockedRequest.mockResolvedValueOnce({ artist: { id: 'ar1', name: 'The Artist' } });
    mockedRequest.mockResolvedValueOnce({
      topSongs: {
        song: [
          { id: 's1', title: 'Hit' },
          { id: 's2', title: 'Hit' },
          { id: 's3', title: 'Other' },
        ],
      },
    });
    const tracks = await getArtistTopTracks('ar1', 1);
    expect(tracks).toHaveLength(1);
  });

  it('getArtistTracks flattens every album’s tracks, sorted A-Z', async () => {
    mockedRequest.mockResolvedValueOnce({
      artist: { id: 'ar1', name: 'x', album: [{ id: 'al1', name: 'Album' }] },
    });
    mockedRequest.mockResolvedValueOnce({
      album: {
        id: 'al1',
        name: 'Album',
        song: [
          { id: 's2', title: 'Zeta' },
          { id: 's1', title: 'Alpha' },
        ],
      },
    });
    const tracks = await getArtistTracks('ar1');
    expect(tracks.map((t) => t.Name)).toEqual(['Alpha', 'Zeta']);
  });
});
