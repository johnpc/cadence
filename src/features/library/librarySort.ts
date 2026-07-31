import {
  buildLibraryRows,
  filterRowsByText,
  type LibraryFilter,
  type LibraryRow,
} from './libraryRows';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** How the library list is ordered:
 * - 'recents' (default): most recently PLAYED first
 * - 'alpha': A–Z by name
 * - 'added': most recently CREATED first (playlist DateCreated)
 * - 'updated': most recently CHANGED first (playlist DateLastMediaAdded).
 * Non-playlist rows (albums/artists) and pseudo-playlists lack these dates, so
 * 'added'/'updated' fall back to server order for them (a stable sort). */
export type LibrarySort = 'recents' | 'alpha' | 'added' | 'updated';

/** The sort options shown in the Your Library sort dropdown, with human labels. */
export const LIBRARY_SORTS: { value: LibrarySort; label: string }[] = [
  { value: 'recents', label: 'Recently played' },
  { value: 'alpha', label: 'A–Z' },
  { value: 'added', label: 'Recently added' },
  { value: 'updated', label: 'Recently updated' },
];

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
  const sorted = sortRest(rest, sort, plays);
  // Hearted playlists bubble above the rest (below the pinned pseudo-playlists),
  // keeping each group's chosen order — a stable partition, not a re-sort.
  const favorites = sorted.filter((r) => r.favorite);
  const others = sorted.filter((r) => !r.favorite);
  return [...pinned, ...favorites, ...others];
}

/** Millis for the chosen date sort, or 0 when the row's item lacks it (albums/
 * artists have no playlist dates → they keep server order via the stable tiebreak). */
function sortDate(row: LibraryRow, sort: LibrarySort): number {
  const raw = sort === 'added' ? row.item?.DateCreated : row.item?.DateLastMediaAdded;
  const t = raw ? Date.parse(raw) : NaN;
  return Number.isNaN(t) ? 0 : t;
}

/** Order the non-pinned rows by the chosen sort. Alpha is a plain name compare;
 * every other order is a STABLE sort by a numeric key desc (recency/date), so
 * ties and keyless rows keep their server order. */
function sortRest(
  rest: LibraryRow[],
  sort: LibrarySort,
  plays: Record<string, number>,
): LibraryRow[] {
  if (sort === 'alpha') {
    return [...rest].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  }
  const key =
    sort === 'recents' ? (r: LibraryRow) => plays[r.id] ?? 0 : (r: LibraryRow) => sortDate(r, sort);
  return rest
    .map((r, i) => ({ r, i }))
    .sort((a, b) => key(b.r) - key(a.r) || a.i - b.i)
    .map((e) => e.r);
}
