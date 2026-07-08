import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The album's release year as a string for the header, or '' when unknown.
 * Genres are shown separately as chips (see GenreChips). */
export function albumMeta(album: JellyfinItem | null): string {
  if (!album?.ProductionYear) return '';
  return String(album.ProductionYear);
}
