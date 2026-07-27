import { getPlaylistItems } from '../../lib/navidromePlaylists';
import { createItemListCache } from '../../lib/itemListCache';
import type { MediaItem } from '../../lib/navidromeTypes';

/** Disk cache of playlist track lists — see itemListCache. Playlists are the
 * biggest/slowest lists and change rarely, so a revisit paints instantly. */
const cache = createItemListCache('cadence.playlist-items');

export const PLAYLIST_ITEMS_CACHE_KEY = cache.storageKey;

/** Cached tracks for a playlist, or undefined when not cached. */
export function getCachedPlaylistItems(playlistId: string): MediaItem[] | undefined {
  return cache.get(playlistId);
}

/** Fetch a playlist's tracks and persist them (the query fn for usePlaylistItems). */
export function fetchAndCachePlaylistItems(playlistId: string): Promise<MediaItem[]> {
  return cache.fetchAndCache(playlistId, getPlaylistItems);
}

/** Persist a playlist's tracks (used by tests / optimistic updates). */
export function setCachedPlaylistItems(playlistId: string, tracks: MediaItem[]): void {
  cache.set(playlistId, tracks);
}
