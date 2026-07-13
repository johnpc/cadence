import type { QueryClient } from '@tanstack/react-query';

/** localStorage keys that are CACHES (safe to wipe), NOT settings/session. The
 * session token, server URL, device id, theme, volume, and user preferences are
 * deliberately left alone so clearing the cache never signs the user out or
 * resets their choices. Add any future disk cache here. */
const CACHE_LS_KEYS = ['cadence.playlist-items'];

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
