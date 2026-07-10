import type { JellyfinItem } from '../../lib/jellyfinTypes';
import { pinnedRows } from './pinnedRows';

/** Which section of the library is shown. */
export type LibraryFilter = 'playlists' | 'albums' | 'artists';

/** Parse the initial library filter from a URL search string (e.g.
 * "?filter=artists" from a Home "Show all" link), defaulting to 'playlists'
 * for anything missing/unrecognised. */
export function filterFromSearch(search: string): LibraryFilter {
  const value = new URLSearchParams(search).get('filter');
  return value === 'albums' || value === 'artists' ? value : 'playlists';
}

/** A single row in the unified library list. `to` is its route; `round` marks
 * artist art; `subtitle` is the small line under the name. */
export interface LibraryRow {
  id: string;
  name: string;
  subtitle: string;
  to: string;
  round: boolean;
  /** The backing item for cover art (null for the synthetic Liked Songs row). */
  item: JellyfinItem | null;
  /** True for the pinned Liked Songs pseudo-playlist (renders a heart tile). */
  liked?: boolean;
  /** True for the pinned Downloads pseudo-playlist (renders a download tile). */
  downloads?: boolean;
  /** True for any pinned pseudo-playlist (Liked Songs / Downloads) kept at the
   * top of the list regardless of sort. */
  pinned?: boolean;
}

/** Build the rows for the active filter. Under "playlists", Liked Songs is
 * pinned first as a pseudo-playlist, then the real playlists. */
export function buildLibraryRows(
  filter: LibraryFilter,
  data: {
    playlists: JellyfinItem[];
    albums: JellyfinItem[];
    artists: JellyfinItem[];
    likedCount: number;
    downloadsCount: number;
  },
): LibraryRow[] {
  if (filter === 'albums') {
    return data.albums.map((a) => ({
      id: a.Id,
      name: a.Name,
      subtitle: a.AlbumArtist ?? a.Artists?.[0] ?? 'Album',
      to: `/album/${a.Id}`,
      round: false,
      item: a,
    }));
  }
  if (filter === 'artists') {
    return data.artists.map((a) => ({
      id: a.Id,
      name: a.Name,
      subtitle: 'Artist',
      to: `/artist/${a.Id}`,
      round: true,
      item: a,
    }));
  }
  return [
    ...pinnedRows(data.likedCount, data.downloadsCount),
    ...data.playlists.map((p) => ({
      id: p.Id,
      name: p.Name,
      subtitle: 'Playlist',
      to: `/playlist/${p.Id}`,
      round: false,
      item: p,
    })),
  ];
}

/** Narrow rows to those whose name contains `query` (case-insensitive). An
 * empty/blank query returns the list unchanged. */
export function filterRowsByText(rows: LibraryRow[], query: string): LibraryRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((r) => r.name.toLowerCase().includes(q));
}
