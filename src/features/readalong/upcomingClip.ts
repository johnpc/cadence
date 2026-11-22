import { toGlobalSeconds } from './timeline';
import type { ReadAlongClip, ReadAlongPart } from './storytellerApi';

/**
 * During a silent stretch (intro music, credits, a long pause) nothing is being
 * narrated, so no sentence is active — but the listener still needs to know the
 * text is alive. The first clip AFTER the playhead is the "upcoming" sentence:
 * the sheet marks it and counts down to it. Null when a clip is active (not a
 * silent stretch), when the position can't be placed, or when nothing follows.
 */
export function upcomingClip(
  clips: ReadAlongClip[],
  parts: ReadAlongPart[],
  currentItemId: string,
  positionSeconds: number,
): { clip: ReadAlongClip; secondsUntil: number } | null {
  const global = toGlobalSeconds(parts, currentItemId, positionSeconds);
  if (global === null) return null;
  // Binary search: first clip starting after the playhead.
  let lo = 0;
  let hi = clips.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (clips[mid].Start > global) hi = mid;
    else lo = mid + 1;
  }
  const clip = clips[lo];
  return clip ? { clip, secondsUntil: clip.Start - global } : null;
}
