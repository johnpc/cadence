import type { MediaItem } from '../../lib/navidromeTypes';

/** The detail-page path for a mixed item, by its MediaItem Type — used by the
 * "Jump back in" shelf, whose cards can be albums, playlists, or artists.
 * Falls back to the album page (the most common played collection). */
export function detailPath(item: MediaItem): string {
  switch (item.Type) {
    case 'MusicArtist':
      return `/artist/${item.Id}`;
    case 'Playlist':
      return `/playlist/${item.Id}`;
    default:
      return `/album/${item.Id}`;
  }
}
