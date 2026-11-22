/**
 * Pure arithmetic over a read-along book's timeline. The plugin hands us clips on
 * a GLOBAL clock (seconds from the start of part 1); the player works in
 * per-part seconds. These helpers convert between the two and find clips.
 */
import type { ReadAlongClip, ReadAlongPart } from './storytellerApi';

/** Where each part starts on the global clock, in play order. */
export function partOffsets(parts: ReadAlongPart[]): number[] {
  const offsets: number[] = [];
  let at = 0;
  for (const part of parts) {
    offsets.push(at);
    at += part.Duration;
  }
  return offsets;
}

/** A per-part position → global seconds; null when the item isn't a part. */
export function toGlobalSeconds(
  parts: ReadAlongPart[],
  itemId: string,
  seconds: number,
): number | null {
  const index = parts.findIndex((p) => p.ItemId === itemId);
  if (index === -1) return null;
  return partOffsets(parts)[index] + seconds;
}

/** Global seconds → the part holding it plus the offset within that part. Past
 * the end lands in the last part; before the start clamps to 0 of the first. */
export function toPartPosition(
  parts: ReadAlongPart[],
  globalSeconds: number,
): { itemId: string; seconds: number } | null {
  if (parts.length === 0) return null;
  const offsets = partOffsets(parts);
  let index = parts.length - 1;
  for (let i = 0; i < parts.length; i++) {
    if (globalSeconds < offsets[i] + parts[i].Duration) {
      index = i;
      break;
    }
  }
  return { itemId: parts[index].ItemId, seconds: Math.max(0, globalSeconds - offsets[index]) };
}

/** Index of the clip narrated at `seconds` — the last clip whose Start ≤
 * seconds (binary search; clips are sorted by Start). -1 before the first clip. */
export function clipAt(clips: ReadAlongClip[], seconds: number): number {
  let lo = 0;
  let hi = clips.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (clips[mid].Start <= seconds) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

/** The clip for a tapped sentence (chapter + element id), or null. */
export function clipForFragment(
  clips: ReadAlongClip[],
  chapter: number,
  fragment: string,
): ReadAlongClip | null {
  return clips.find((c) => c.Chapter === chapter && c.Fragment === fragment) ?? null;
}

/** The clip narrated right now: the current part's position lifted onto the
 * global clock, then looked up. -1 when the track isn't a part of this book. */
export function activeClipIndex(
  clips: ReadAlongClip[],
  parts: ReadAlongPart[],
  currentItemId: string,
  positionSeconds: number,
): number {
  const global = toGlobalSeconds(parts, currentItemId, positionSeconds);
  return global === null ? -1 : clipAt(clips, global);
}
