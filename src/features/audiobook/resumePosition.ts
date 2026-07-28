import { isAudiobook } from './isAudiobook';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const TICKS_PER_SECOND = 10_000_000;
// Ignore a trivially-small saved position (just started) and don't resume within
// this margin of the end (finished → start over, not 2s from the end).
const MIN_RESUME_SECONDS = 5;
const END_MARGIN_SECONDS = 15;

/**
 * The position (in seconds) an audiobook should resume from on load, or null when
 * it shouldn't auto-resume: not an audiobook, no saved position, barely started,
 * marked played, or essentially at the end. Pure so it's unit-testable; the hook
 * just feeds it the item + its known duration.
 */
export function resumeSeconds(
  item: JellyfinItem | null | undefined,
  durationSeconds: number,
): number | null {
  if (!isAudiobook(item)) return null;
  const ud = item?.UserData;
  if (!ud || ud.Played) return null;
  const ticks = ud.PlaybackPositionTicks ?? 0;
  const seconds = ticks / TICKS_PER_SECOND;
  if (seconds < MIN_RESUME_SECONDS) return null;
  if (durationSeconds > 0 && seconds > durationSeconds - END_MARGIN_SECONDS) return null;
  return seconds;
}
