import {
  buildLibraryRows,
  filterRowsByText,
  type LibraryFilter,
  type LibraryRow,
} from './libraryRows';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** How the library list is ordered. 'recents' (the default) bubbles recently-
 * played items to the top; 'alpha' sorts by name. */
export type LibrarySort = 'recents' | 'alpha';

/** Build → text-filter → sort the library rows for the current view. Pure, so
 * LibraryList stays thin and this whole pipeline is unit-testable in one call. */
export function composeLibraryRows(
  filter: LibraryFilter,
  data: {
    playlists: JellyfinItem[];
    albums: JellyfinItem[];
    artists: JellyfinItem[];
    likedCount: number;
    downloadsCount: number;
  },
  query: string,
  sort: LibrarySort,
  plays: Record<string, number>,
): LibraryRow[] {
  return sortRows(filterRowsByText(buildLibraryRows(filter, data), query), sort, plays);
}

/** Sort rows by the chosen order, always keeping the pinned pseudo-playlists
 * (Liked Songs, Downloads) first. 'recents' orders by last-played time (most
 * recent first; never-played items keep their server order, below the played
 * ones — a stable sort). */
export function sortRows(
  rows: LibraryRow[],
  sort: LibrarySort,
  plays: Record<string, number> = {},
): LibraryRow[] {
  const pinned = rows.filter((r) => r.pinned);
  const rest = rows.filter((r) => !r.pinned);
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
