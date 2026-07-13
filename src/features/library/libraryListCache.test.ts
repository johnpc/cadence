import { afterEach, describe, expect, it, vi } from 'vitest';
import { LIBRARY_LISTS_CACHE_KEY, getCachedList, fetchAndCacheList } from './libraryListCache';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const item = (id: string): JellyfinItem => ({ Id: id, Name: id, Type: 'Audio' });

afterEach(() => localStorage.clear());

describe('libraryListCache', () => {
  it('exposes its localStorage key so Clear-cache can flush it', () => {
    expect(LIBRARY_LISTS_CACHE_KEY).toBe('cadence.library-lists');
  });

  it('returns undefined for a list that has not been cached', () => {
    expect(getCachedList('liked-songs')).toBeUndefined();
  });

  it('fetches a list, persists it under its kind, and reads it back', async () => {
    const fetcher = vi.fn().mockResolvedValue([item('a'), item('b')]);
    const out = await fetchAndCacheList('liked-songs', fetcher);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(out.map((i) => i.Id)).toEqual(['a', 'b']);
    expect(getCachedList('liked-songs')?.map((i) => i.Id)).toEqual(['a', 'b']);
  });

  it('keeps lists independent by kind', async () => {
    await fetchAndCacheList('saved-albums', () => Promise.resolve([item('x')]));
    await fetchAndCacheList('followed-artists', () => Promise.resolve([item('y')]));
    expect(getCachedList('saved-albums')?.[0].Id).toBe('x');
    expect(getCachedList('followed-artists')?.[0].Id).toBe('y');
  });
});
