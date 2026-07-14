import { createItemListCache } from '../../lib/itemListCache';
import { getPlaylists } from '../../lib/jellyfinPlaylists';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Disk cache of the user's OWNED playlists (the Your Library list). Building it
 * is expensive on the first load — getPlaylists lists every playlist on the
 * server then confirms ownership with a `/Playlists/{id}/Users` call PER
 * candidate (~3s each over the tunnel; an admin, whose CanDelete is true for
 * every playlist, pays that for all of them). So persist the result and seed the
 * query with it: Your Library paints its playlists INSTANTLY on return, then
 * refetches in the background. Single fixed key — it's one list, not per-id.
 */
const cache = createItemListCache('cadence.playlists-list');
const KEY = 'owned';

/** localStorage key for the playlists-list cache (so Clear-cache can flush it). */
export const PLAYLISTS_LIST_CACHE_KEY = cache.storageKey;

/** Cached owned-playlists list, or undefined when not cached yet. */
export function getCachedPlaylists(): JellyfinItem[] | undefined {
  return cache.get(KEY);
}

/** Fetch the owned playlists and persist them (query fn). */
export function fetchAndCachePlaylists(): Promise<JellyfinItem[]> {
  return cache.fetchAndCache(KEY, () => getPlaylists());
}
