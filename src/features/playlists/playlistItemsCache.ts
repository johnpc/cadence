import { getPlaylistItems } from '../../lib/jellyfinPlaylists';
import { createItemListCache } from '../../lib/itemListCache';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Disk cache of playlist track lists — see itemListCache. Playlists are the
 * biggest/slowest lists and change rarely, so a revisit paints instantly. */
const cache = createItemListCache('cadence.playlist-items');

export const PLAYLIST_ITEMS_CACHE_KEY = cache.storageKey;

/** Cached tracks for a playlist, or undefined when not cached. */
export function getCachedPlaylistItems(playlistId: string): JellyfinItem[] | undefined {
  return cache.get(playlistId);
}

/** Fetch a playlist's tracks and persist them (the query fn for usePlaylistItems). */
export function fetchAndCachePlaylistItems(playlistId: string): Promise<JellyfinItem[]> {
  return cache.fetchAndCache(playlistId, getPlaylistItems);
}

/** Persist a playlist's tracks (used by tests / optimistic updates). */
export function setCachedPlaylistItems(playlistId: string, tracks: JellyfinItem[]): void {
  cache.set(playlistId, tracks);
}
