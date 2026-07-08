import { artistLine } from '../player/playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Filter a track list by a free-text query, matching the song title, album, or
 * any artist (case-insensitive). An empty query returns the list unchanged.
 * Pure so the "Find in playlist" box stays unit-testable. */
export function filterTracks(tracks: JellyfinItem[], query: string): JellyfinItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return tracks;
  return tracks.filter((t) => {
    const haystack = [t.Name, t.Album, artistLine(t)].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  });
}
