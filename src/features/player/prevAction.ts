/** How many seconds into a track "previous" restarts it instead of going back
 * to the prior track (Spotify/iOS/desktop-player convention). */
export const PREV_RESTART_THRESHOLD = 3;

/** Decide what the "previous" button does given the current playback position:
 * within the first few seconds it goes to the previous track, but once you're
 * further in it restarts the current track (so a stray press mid-song doesn't
 * skip back). Pure so the threshold is unit-testable. */
export function prevAction(
  position: number,
  threshold = PREV_RESTART_THRESHOLD,
): 'previous' | 'restart' {
  return position > threshold ? 'restart' : 'previous';
}
