import { describe, expect, it, vi } from 'vitest';

vi.mock('./navidromeFetch', () => ({ request: vi.fn() }));

import { request } from './navidromeFetch';
import { getAlbumsByIds, getSongsByIds } from './navidromeItemsByIds';

const mockedRequest = vi.mocked(request);

describe('navidromeItemsByIds', () => {
  it('getAlbumsByIds hydrates in the given order, dropping missing ones', async () => {
    mockedRequest
      .mockResolvedValueOnce({ album: { id: 'a', name: 'A' } })
      .mockRejectedValueOnce(new Error('404'));
    expect(await getAlbumsByIds(['a', 'missing'])).toEqual([expect.objectContaining({ Id: 'a' })]);
  });

  it('getAlbumsByIds returns [] for an empty list without calling request', async () => {
    mockedRequest.mockClear();
    expect(await getAlbumsByIds([])).toEqual([]);
    expect(request).not.toHaveBeenCalled();
  });

  it('getSongsByIds hydrates in the given order, dropping missing ones', async () => {
    mockedRequest
      .mockResolvedValueOnce({ song: { id: 's1', title: 'A' } })
      .mockRejectedValueOnce(new Error('404'));
    expect(await getSongsByIds(['s1', 'missing'])).toEqual([expect.objectContaining({ Id: 's1' })]);
  });

  it('getSongsByIds returns [] for an empty list without calling request', async () => {
    mockedRequest.mockClear();
    expect(await getSongsByIds([])).toEqual([]);
    expect(request).not.toHaveBeenCalled();
  });
});
