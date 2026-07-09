import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** True when `tracks` is the collection currently loaded in the player — i.e.
 * the queue holds exactly these track ids in the same order. Lets a
 * collection's play button become a pause/resume toggle (Spotify-style) instead
 * of restarting from the top. Pure so it's cheap + unit-testable. */
export function isActiveQueue(tracks: JellyfinItem[], queue: JellyfinItem[]): boolean {
  if (tracks.length === 0 || tracks.length !== queue.length) return false;
  for (let i = 0; i < tracks.length; i++) {
    if (tracks[i].Id !== queue[i].Id) return false;
  }
  return true;
}
