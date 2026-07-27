import { describe, expect, it, vi } from 'vitest';

vi.mock('./navidromeFetch', () => ({ request: vi.fn() }));

import { request } from './navidromeFetch';
import {
  getSong,
  getAlbum,
  getAlbumTracks,
  getSimilarSongs,
  getStarred2,
  getFavoriteSongs,
  getFavoriteAlbums,
  addFavorite,
  removeFavorite,
} from './navidromeItems';

const mockedRequest = vi.mocked(request);

describe('navidromeItems', () => {
  it('getSong maps the response to a MediaItem', async () => {
    mockedRequest.mockResolvedValue({ song: { id: 's1', title: 'A Song' } });
    const song = await getSong('s1');
    expect(request).toHaveBeenCalledWith('/getSong', { params: { id: 's1' } });
    expect(song).toMatchObject({ Id: 's1', Name: 'A Song', Type: 'Audio' });
  });

  it('getAlbum maps the response to a MediaItem', async () => {
    mockedRequest.mockResolvedValue({ album: { id: 'al1', name: 'An Album' } });
    const album = await getAlbum('al1');
    expect(request).toHaveBeenCalledWith('/getAlbum', { params: { id: 'al1' } });
    expect(album).toMatchObject({ Id: 'al1', Name: 'An Album', Type: 'MusicAlbum' });
  });

  it('getAlbumTracks returns the deduped song list from getAlbum', async () => {
    mockedRequest.mockResolvedValue({
      album: {
        id: 'al1',
        name: 'x',
        song: [
          { id: 's1', title: 'A' },
          { id: 's1', title: 'A' },
        ],
      },
    });
    const tracks = await getAlbumTracks('al1');
    expect(tracks).toHaveLength(1);
  });

  it('getSimilarSongs calls getSimilarSongs2 with id + count', async () => {
    mockedRequest.mockResolvedValue({ similarSongs2: { song: [{ id: 's1', title: 'A' }] } });
    const songs = await getSimilarSongs('seed1', 20);
    expect(request).toHaveBeenCalledWith('/getSimilarSongs2', {
      params: { id: 'seed1', count: 20 },
    });
    expect(songs).toHaveLength(1);
  });

  it('getStarred2 defaults missing arrays to empty', async () => {
    mockedRequest.mockResolvedValue({ starred2: {} });
    expect(await getStarred2()).toEqual({ song: [], album: [], artist: [] });
  });

  it('getFavoriteSongs maps starred2.song', async () => {
    mockedRequest.mockResolvedValue({ starred2: { song: [{ id: 's1', title: 'A' }] } });
    expect(await getFavoriteSongs()).toEqual([expect.objectContaining({ Id: 's1' })]);
  });

  it('getFavoriteAlbums dedupes starred2.album by name', async () => {
    mockedRequest.mockResolvedValue({
      starred2: {
        album: [
          { id: 'al1', name: 'Same' },
          { id: 'al2', name: 'Same' },
        ],
      },
    });
    expect(await getFavoriteAlbums()).toHaveLength(1);
  });

  it('addFavorite stars a song by default (param `id`)', async () => {
    mockedRequest.mockResolvedValue({});
    await addFavorite('s1');
    expect(request).toHaveBeenCalledWith('/star', { params: { id: 's1' } });
  });

  it('addFavorite stars an album/artist via the right param name', async () => {
    mockedRequest.mockResolvedValue({});
    await addFavorite('al1', 'album');
    expect(request).toHaveBeenCalledWith('/star', { params: { albumId: 'al1' } });
    await addFavorite('ar1', 'artist');
    expect(request).toHaveBeenCalledWith('/star', { params: { artistId: 'ar1' } });
  });

  it('removeFavorite unstars with the right param name', async () => {
    mockedRequest.mockResolvedValue({});
    await removeFavorite('s1');
    expect(request).toHaveBeenCalledWith('/unstar', { params: { id: 's1' } });
  });
});
