import { createItemListCache } from '../../lib/itemListCache';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Disk cache of the Your Library lists (liked songs, saved albums, followed
 * artists). Your Library is a high-traffic tab whose lists are costly to fetch
 * over the tunnel, so we persist the last-seen list per kind and seed each query
 * with it — a returning user sees their library INSTANTLY from disk, then
 * react-query refetches in the background. A like/unlike invalidates the query,
 * and because the query fn re-persists on every fetch, the disk copy self-heals
 * within one refetch. Same pattern as the home-shelf cache, keyed by list name.
 */
const libraryListCache = createItemListCache('cadence.library-lists');
export const LIBRARY_LISTS_CACHE_KEY = libraryListCache.storageKey;

/** Cached list for a kind, or undefined when not cached yet. */
export function getCachedList(kind: string): JellyfinItem[] | undefined {
  return libraryListCache.get(kind);
}

/** Fetch a library list via `fetcher` and persist it under `kind` (query fn). */
export function fetchAndCacheList(
  kind: string,
  fetcher: () => Promise<JellyfinItem[]>,
): Promise<JellyfinItem[]> {
  return libraryListCache.fetchAndCache(kind, () => fetcher());
}
