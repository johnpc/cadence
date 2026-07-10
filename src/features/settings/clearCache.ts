import type { QueryClient } from '@tanstack/react-query';

/** Wipe Cadence's caches without touching the session or user data (likes,
 * playlists, theme live on the Jellyfin server or in Preferences — untouched).
 * Clears the react-query cache (all cached Jellyfin responses) and any
 * Cache Storage buckets (PWA/image caches), then refetches active queries so
 * the current screen repaints with fresh data instead of going blank. */
export async function clearCache(queryClient: QueryClient): Promise<void> {
  queryClient.clear();
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
