import { createItemListCache } from '../../lib/itemListCache';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Disk cache of the Home shelves (recently-added, suggested, recently-played,
 * community playlists…). Home is the app's entry point and most-visited screen,
 * yet its shelves are costly to fetch over the tunnel — so we persist the
 * last-seen list per shelf and seed each query with it. A returning user sees
 * their Home shelves INSTANTLY from disk, then react-query refetches in the
 * background. Same pattern as the album/artist/playlist list caches, keyed by a
 * fixed shelf name instead of an item id.
 */
const homeShelfCache = createItemListCache('cadence.home-shelves');
export const HOME_SHELVES_CACHE_KEY = homeShelfCache.storageKey;

/** Cached list for a shelf, or undefined when not cached yet. */
export function getCachedShelf(shelf: string): JellyfinItem[] | undefined {
  return homeShelfCache.get(shelf);
}

/** Fetch a shelf via `fetcher` and persist it under `shelf` (query fn). The
 * fetcher ignores the id arg — the shelf name is only the cache key. */
export function fetchAndCacheShelf(
  shelf: string,
  fetcher: () => Promise<JellyfinItem[]>,
): Promise<JellyfinItem[]> {
  return homeShelfCache.fetchAndCache(shelf, () => fetcher());
}
