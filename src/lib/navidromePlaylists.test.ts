import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./navidromeFetch', () => ({ request: vi.fn() }));

import { request } from './navidromeFetch';
import {
  removeFromPlaylist,
  deletePlaylist,
  renamePlaylist,
  getPlaylistIsPublic,
  setPlaylistIsPublic,
  createPlaylist,
  createPlaylistWithItems,
  addToPlaylist,
} from './navidromePlaylists';

const mockedRequest = vi.mocked(request);

describe('navidromePlaylists', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('removeFromPlaylist sends the entry index, not an id', async () => {
    mockedRequest.mockResolvedValue({});
    await removeFromPlaylist('p1', '3');
    expect(request).toHaveBeenCalledWith('/updatePlaylist', {
      method: 'POST',
      params: { playlistId: 'p1', songIndexToRemove: 3 },
    });
  });

  it('deletePlaylist calls the Subsonic deletePlaylist endpoint', async () => {
    mockedRequest.mockResolvedValue({});
    await deletePlaylist('p1');
    expect(request).toHaveBeenCalledWith('/deletePlaylist', { params: { id: 'p1' } });
  });

  it('renamePlaylist updates the name field', async () => {
    mockedRequest.mockResolvedValue({});
    await renamePlaylist('p1', 'New Name');
    expect(request).toHaveBeenCalledWith('/updatePlaylist', {
      method: 'POST',
      params: { playlistId: 'p1', name: 'New Name' },
    });
  });

  it('getPlaylistIsPublic reads the public field', async () => {
    mockedRequest.mockResolvedValue({ playlist: { public: true } });
    expect(await getPlaylistIsPublic('p1')).toBe(true);
  });

  it('setPlaylistIsPublic sends the public flag', async () => {
    mockedRequest.mockResolvedValue({});
    await setPlaylistIsPublic('p1', true);
    expect(request).toHaveBeenCalledWith('/updatePlaylist', {
      method: 'POST',
      params: { playlistId: 'p1', public: true },
    });
  });

  it('createPlaylist creates then locks the playlist private', async () => {
    mockedRequest.mockResolvedValueOnce({ playlist: { id: 'new1' } });
    mockedRequest.mockResolvedValueOnce({});
    const id = await createPlaylist('Mix');
    expect(id).toBe('new1');
    expect(request).toHaveBeenNthCalledWith(1, '/createPlaylist', {
      method: 'POST',
      params: { name: 'Mix' },
    });
    expect(request).toHaveBeenNthCalledWith(2, '/updatePlaylist', {
      method: 'POST',
      params: { playlistId: 'new1', public: false },
    });
  });

  it('createPlaylistWithItems passes repeated songId params', async () => {
    mockedRequest.mockResolvedValueOnce({ playlist: { id: 'new1' } });
    mockedRequest.mockResolvedValueOnce({});
    await createPlaylistWithItems('Mix', ['a', 'b']);
    expect(request).toHaveBeenNthCalledWith(1, '/createPlaylist', {
      method: 'POST',
      params: { name: 'Mix', songId: ['a', 'b'] },
    });
  });

  it('addToPlaylist sends songIdToAdd', async () => {
    mockedRequest.mockResolvedValue({});
    await addToPlaylist('p1', 's1');
    expect(request).toHaveBeenCalledWith('/updatePlaylist', {
      method: 'POST',
      params: { playlistId: 'p1', songIdToAdd: 's1' },
    });
  });
});
