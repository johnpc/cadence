/**
 * Search the songs on the device — what "search" means with no connection. Every
 * word of the query must appear in a song's title, artist, album artist or
 * album (case- and accent-insensitive). Title matches rank first: a title that
 * starts with the query, then one that contains it, then the rest.
 */
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const fold = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

function rank(title: string, query: string): number {
  if (title.startsWith(query)) return 0;
  return title.includes(query) ? 1 : 2;
}

export function searchDownloads(query: string, tracks: JellyfinItem[], limit = 50): JellyfinItem[] {
  const q = fold(query.trim());
  if (!q) return [];
  const words = q.split(/\s+/);
  const scored: { track: JellyfinItem; score: number }[] = [];
  for (const track of tracks) {
    const title = fold(track.Name ?? '');
    const hay = [title, ...(track.Artists ?? []), track.AlbumArtist ?? '', track.Album ?? '']
      .map((part) => fold(part))
      .join(' ');
    if (words.every((w) => hay.includes(w))) scored.push({ track, score: rank(title, q) });
  }
  return scored
    .sort((a, b) => a.score - b.score || (a.track.Name ?? '').localeCompare(b.track.Name ?? ''))
    .slice(0, limit)
    .map((s) => s.track);
}
