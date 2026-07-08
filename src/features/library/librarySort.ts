import type { LibraryRow } from './libraryRows';

/** How the library list is ordered. 'recents' (the default) bubbles recently-
 * played items to the top; 'alpha' sorts by name. */
export type LibrarySort = 'recents' | 'alpha';

/** Sort rows by the chosen order, always keeping the pinned Liked Songs row
 * first. 'recents' orders by last-played time (most recent first; never-played
 * items keep their server order, below the played ones — a stable sort). */
export function sortRows(
  rows: LibraryRow[],
  sort: LibrarySort,
  plays: Record<string, number> = {},
): LibraryRow[] {
  const pinned = rows.filter((r) => r.liked);
  const rest = rows.filter((r) => !r.liked);
  const sorted =
    sort === 'alpha'
      ? [...rest].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
      : // Stable sort by last-played desc; unplayed (0) keep their server order.
        rest
          .map((r, i) => ({ r, i }))
          .sort((a, b) => (plays[b.r.id] ?? 0) - (plays[a.r.id] ?? 0) || a.i - b.i)
          .map((e) => e.r);
  return [...pinned, ...sorted];
}
