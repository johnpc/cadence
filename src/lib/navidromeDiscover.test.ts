import { describe, expect, it, vi } from 'vitest';

vi.mock('./navidromeFetch', () => ({ request: vi.fn() }));

import { request } from './navidromeFetch';
import {
  getLatestAlbums,
  getRecentlyPlayed,
  getOnRepeat,
  getSuggestedSongs,
} from './navidromeDiscover';

const mockedRequest = vi.mocked(request);

describe('navidromeDiscover', () => {
  it('getLatestAlbums requests getAlbumList2 type=newest', async () => {
    mockedRequest.mockResolvedValue({ albumList2: { album: [{ id: 'a1', name: 'A' }] } });
    const albums = await getLatestAlbums(10);
    expect(request).toHaveBeenCalledWith('/getAlbumList2', {
      params: { type: 'newest', size: 10 },
    });
    expect(albums).toEqual([expect.objectContaining({ Id: 'a1', Type: 'MusicAlbum' })]);
  });

  it('getRecentlyPlayed requests getAlbumList2 type=recent', async () => {
    mockedRequest.mockResolvedValue({ albumList2: {} });
    await getRecentlyPlayed(5);
    expect(request).toHaveBeenCalledWith('/getAlbumList2', { params: { type: 'recent', size: 5 } });
  });

  it('getOnRepeat requests getAlbumList2 type=frequent', async () => {
    mockedRequest.mockResolvedValue({ albumList2: {} });
    await getOnRepeat(5);
    expect(request).toHaveBeenCalledWith('/getAlbumList2', {
      params: { type: 'frequent', size: 5 },
    });
  });

  it('getSuggestedSongs requests getRandomSongs', async () => {
    mockedRequest.mockResolvedValue({ randomSongs: { song: [{ id: 's1', title: 'A' }] } });
    const songs = await getSuggestedSongs(20);
    expect(request).toHaveBeenCalledWith('/getRandomSongs', { params: { size: 20 } });
    expect(songs).toEqual([expect.objectContaining({ Id: 's1', Type: 'Audio' })]);
  });
});
