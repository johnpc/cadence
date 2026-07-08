/**
 * Pure play-queue logic — no DOM, no fetch — so the player provider stays thin
 * and this is exhaustively unit-testable. A queue is an ordered list of tracks
 * plus the current index; shuffle reorders keeping the current track first.
 */
import type { JellyfinItem } from '../../lib/jellyfinTypes';

export interface QueueState {
  tracks: JellyfinItem[];
  index: number;
}

export const EMPTY_QUEUE: QueueState = { tracks: [], index: 0 };

/** The currently-selected track, or null on an empty queue. */
export function currentTrack(q: QueueState): JellyfinItem | null {
  return q.tracks[q.index] ?? null;
}

/** Start a fresh queue from a list at a chosen index (clamped). */
export function startQueue(tracks: JellyfinItem[], startIndex = 0): QueueState {
  const index = Math.max(0, Math.min(startIndex, tracks.length - 1));
  return { tracks, index: tracks.length ? index : 0 };
}

/** True when there's a track after the current one. */
export function hasNext(q: QueueState): boolean {
  return q.index < q.tracks.length - 1;
}

/** True when there's a track before the current one. */
export function hasPrev(q: QueueState): boolean {
  return q.index > 0;
}

/** Advance one track; unchanged at the end of the queue. */
export function next(q: QueueState): QueueState {
  return hasNext(q) ? { ...q, index: q.index + 1 } : q;
}

/** Go back one track; unchanged at the start of the queue. */
export function prev(q: QueueState): QueueState {
  return hasPrev(q) ? { ...q, index: q.index - 1 } : q;
}

/** Append tracks to the end of the queue (used for radio / instant-mix). */
export function append(q: QueueState, tracks: JellyfinItem[]): QueueState {
  return { ...q, tracks: [...q.tracks, ...tracks] };
}

/** A fresh queue from a fully-shuffled copy of `tracks` (Fisher–Yates), starting
 * at index 0. `rand` is injected for deterministic tests. */
export function startShuffled(tracks: JellyfinItem[], rand: () => number): QueueState {
  const shuffled = [...tracks];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return { tracks: shuffled, index: 0 };
}

/** Insert a track right after the current one ("play next"). */
export function enqueueNext(q: QueueState, track: JellyfinItem): QueueState {
  if (!q.tracks.length) return { tracks: [track], index: 0 };
  const tracks = [...q.tracks];
  tracks.splice(q.index + 1, 0, track);
  return { ...q, tracks };
}

/**
 * Fisher–Yates shuffle of everything AFTER the current track, keeping the
 * playing track in place at index 0 of a new queue. `rand` is injected (returns
 * [0,1)) so tests are deterministic.
 */
export function shuffleRest(q: QueueState, rand: () => number): QueueState {
  const current = currentTrack(q);
  if (!current) return q;
  const rest = q.tracks.filter((_, i) => i !== q.index);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return { tracks: [current, ...rest], index: 0 };
}
