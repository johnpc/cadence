import type { MediaItem } from '../../lib/navidromeTypes';

/** The album's release year as a string for the header, or '' when unknown.
 * Genres are shown separately as chips (see GenreChips). */
export function albumMeta(album: MediaItem | null): string {
  if (!album?.ProductionYear) return '';
  return String(album.ProductionYear);
}
