import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Which section of the library is shown. */
export type LibraryFilter = 'playlists' | 'albums' | 'artists';

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
  const liked: LibraryRow = {
    id: 'liked-songs',
    name: 'Liked Songs',
    subtitle: `Playlist • ${data.likedCount} ${data.likedCount === 1 ? 'song' : 'songs'}`,
    to: '/liked',
    round: false,
    item: null,
    liked: true,
  };
  return [
    liked,
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
