import { artistLine } from '../player/playerFormat';
import type { MediaItem } from '../../lib/navidromeTypes';

/** Filter a track list by a free-text query, matching the song title, album, or
 * any artist (case-insensitive). An empty query returns the list unchanged.
 * Pure so the "Find in playlist" box stays unit-testable. */
export function filterTracks(tracks: MediaItem[], query: string): MediaItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return tracks;
  return tracks.filter((t) => {
    const haystack = [t.Name, t.Album, artistLine(t)].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  });
}
