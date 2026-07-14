import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinPlaylists', () => ({ getPlaylists: vi.fn() }));
import { getPlaylists } from '../../lib/jellyfinPlaylists';
import {
  PLAYLISTS_LIST_CACHE_KEY,
  getCachedPlaylists,
  fetchAndCachePlaylists,
} from './playlistsListCache';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const pl = (id: string): JellyfinItem => ({ Id: id, Name: id, Type: 'Playlist' });

afterEach(() => {
  localStorage.clear();
  vi.resetAllMocks();
});

describe('playlistsListCache', () => {
  it('exposes its localStorage key so Clear-cache can flush it', () => {
    expect(PLAYLISTS_LIST_CACHE_KEY).toBe('cadence.playlists-list');
  });

  it('returns undefined before anything is cached', () => {
    expect(getCachedPlaylists()).toBeUndefined();
  });

  it('fetches the owned playlists, persists them, and reads them back', async () => {
    vi.mocked(getPlaylists).mockResolvedValue([pl('a'), pl('b')]);
    const out = await fetchAndCachePlaylists();
    expect(getPlaylists).toHaveBeenCalledOnce();
    expect(out.map((p) => p.Id)).toEqual(['a', 'b']);
    expect(getCachedPlaylists()?.map((p) => p.Id)).toEqual(['a', 'b']);
  });

  it('re-persists on each fetch so an invalidation self-heals the cache', async () => {
    vi.mocked(getPlaylists)
      .mockResolvedValueOnce([pl('a')])
      .mockResolvedValueOnce([pl('a'), pl('c')]);
    await fetchAndCachePlaylists();
    await fetchAndCachePlaylists();
    expect(getCachedPlaylists()?.map((p) => p.Id)).toEqual(['a', 'c']);
  });
});
