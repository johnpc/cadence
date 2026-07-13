import { afterEach, describe, expect, it, vi } from 'vitest';
import { HOME_SHELVES_CACHE_KEY, getCachedShelf, fetchAndCacheShelf } from './homeShelfCache';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const item = (id: string): JellyfinItem => ({ Id: id, Name: id, Type: 'Audio' });

afterEach(() => localStorage.clear());

describe('homeShelfCache', () => {
  it('exposes its localStorage key so Clear-cache can flush it', () => {
    expect(HOME_SHELVES_CACHE_KEY).toBe('cadence.home-shelves');
  });

  it('returns undefined for a shelf that has not been cached', () => {
    expect(getCachedShelf('latest-albums')).toBeUndefined();
  });

  it('fetches a shelf, persists it under its name, and reads it back', async () => {
    const fetcher = vi.fn().mockResolvedValue([item('a'), item('b')]);
    const out = await fetchAndCacheShelf('suggested', fetcher);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(out.map((i) => i.Id)).toEqual(['a', 'b']);
    expect(getCachedShelf('suggested')?.map((i) => i.Id)).toEqual(['a', 'b']);
  });

  it('keeps shelves independent by name', async () => {
    await fetchAndCacheShelf('latest-albums', () => Promise.resolve([item('x')]));
    await fetchAndCacheShelf('recently-played', () => Promise.resolve([item('y')]));
    expect(getCachedShelf('latest-albums')?.[0].Id).toBe('x');
    expect(getCachedShelf('recently-played')?.[0].Id).toBe('y');
  });
});
