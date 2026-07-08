import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** A "2015 • Rock, Indie" meta line for an album header — year and up to two
 * genres, joined by a dot. Returns '' when neither is known. */
export function albumMeta(album: JellyfinItem | null): string {
  if (!album) return '';
  const parts: string[] = [];
  if (album.ProductionYear) parts.push(String(album.ProductionYear));
  if (album.Genres?.length) parts.push(album.Genres.slice(0, 2).join(', '));
  return parts.join(' • ');
}
