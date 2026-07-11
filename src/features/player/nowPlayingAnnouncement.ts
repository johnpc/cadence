import { artistLine } from './playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The spoken string for a track change: "Now playing: <title> by <artist>",
 * dropping the "by …" when the artist is unknown, and '' when nothing plays
 * (which clears the live region). Pure so it's unit-testable. */
export function nowPlayingAnnouncement(track: JellyfinItem | null): string {
  if (!track?.Name) return '';
  const artist = artistLine(track);
  return artist ? `Now playing: ${track.Name} by ${artist}` : `Now playing: ${track.Name}`;
}
