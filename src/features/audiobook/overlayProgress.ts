import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Overlay LIVE per-item reading progress onto the cached audiobook catalog.
 *
 * The plugin caches the static library (titles/art/grouping/runtimes) but its
 * `UserData` (resume position / played) can be up to a day stale — which would
 * make progress bars look frozen after listening. The Audiobooks tab already
 * fetches a small, bounded, live "resumable" query; we splice that fresh
 * `UserData` onto the matching cached files (by id), so in-progress books show
 * real progress while the rest of the catalog stays cheap. Pure + unit-testable.
 *
 * Only `UserData` is taken from the live items (the fresh bit) — everything else
 * (title, art, runtime, grouping fields) comes from the cached copy, which is
 * authoritative for the catalog. Live items with no cached match are ignored
 * (they're already-known parts; the cache is the full library).
 */
export function overlayProgress(cached: JellyfinItem[], live: JellyfinItem[]): JellyfinItem[] {
  if (live.length === 0) return cached;
  const liveById = new Map(live.map((i) => [i.Id, i]));
  return cached.map((item) => {
    const fresh = liveById.get(item.Id);
    return fresh ? { ...item, UserData: fresh.UserData } : item;
  });
}
