import type { QueryClient } from '@tanstack/react-query';
import { PLAYLIST_ITEMS_CACHE_KEY } from '../playlists/playlistItemsCache';
import { PLAYLISTS_LIST_CACHE_KEY } from '../playlists/playlistsListCache';
import { ALBUM_TRACKS_CACHE_KEY, SIMILAR_ALBUMS_CACHE_KEY } from '../album/albumApi';
import { ARTIST_ALBUMS_CACHE_KEY, RELATED_ARTISTS_CACHE_KEY } from '../artist/artistApi';
import { HOME_SHELVES_CACHE_KEY } from '../home/homeShelfCache';
import { LIBRARY_LISTS_CACHE_KEY } from '../library/libraryListCache';

/** localStorage keys that are CACHES (safe to wipe), NOT settings/session. The
 * session token, server URL, device id, theme, volume, and user preferences are
 * deliberately left alone so clearing the cache never signs the user out or
 * resets their choices. Sourced from each cache's own exported key so this can't
 * drift out of sync. */
const CACHE_LS_KEYS = [
  PLAYLIST_ITEMS_CACHE_KEY,
  PLAYLISTS_LIST_CACHE_KEY,
  ALBUM_TRACKS_CACHE_KEY,
  SIMILAR_ALBUMS_CACHE_KEY,
  ARTIST_ALBUMS_CACHE_KEY,
  RELATED_ARTISTS_CACHE_KEY,
  HOME_SHELVES_CACHE_KEY,
  LIBRARY_LISTS_CACHE_KEY,
];

/** Wipe Cadence's caches without touching the session or user data (likes,
 * playlists, theme live on the Jellyfin server or in Preferences — untouched).
 * Clears the react-query cache (all cached Jellyfin responses), the persisted
 * disk caches (e.g. playlist tracks), and any Cache Storage buckets (PWA/image
 * caches), then refetches active queries so the current screen repaints with
 * fresh data instead of going blank. */
export async function clearCache(queryClient: QueryClient): Promise<void> {
  queryClient.clear();
  try {
    for (const k of CACHE_LS_KEYS) localStorage.removeItem(k);
  } catch {
    // localStorage unavailable — best-effort.
  }
  if (typeof caches !== 'undefined') {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {
      // Cache Storage is best-effort (absent/blocked in some contexts).
    }
  }
  await queryClient.refetchQueries();
}
