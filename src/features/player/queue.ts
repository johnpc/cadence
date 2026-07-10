/**
 * Pure play-queue logic — no DOM, no fetch — so the player provider stays thin
 * and this is exhaustively unit-testable. A queue is an ordered list of tracks
 * plus the current index; shuffle reorders keeping the current track first.
 */
import type { JellyfinItem } from '../../lib/jellyfinTypes';

export interface QueueState {
  tracks: JellyfinItem[];
  index: number;
  /** The order before shuffle was turned on, so toggling shuffle OFF can restore
   * it (Spotify-style). Set by shuffleRest, cleared by unshuffle. */
  unshuffled?: JellyfinItem[];
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

/** Advance one track. With `wrap` (repeat-all), the last track wraps to the
 * first; otherwise it's unchanged at the end of the queue. */
export function next(q: QueueState, wrap = false): QueueState {
  if (hasNext(q)) return { ...q, index: q.index + 1 };
  return wrap && q.tracks.length ? { ...q, index: 0 } : q;
}

/** Go back one track. With `wrap` (repeat-all), the first track wraps to the
 * last; otherwise it's unchanged at the start of the queue. */
export function prev(q: QueueState, wrap = false): QueueState {
  if (hasPrev(q)) return { ...q, index: q.index - 1 };
  return wrap && q.tracks.length ? { ...q, index: q.tracks.length - 1 } : q;
}

/** Append tracks to the end of the queue (used for radio / instant-mix). */
export function append(q: QueueState, tracks: JellyfinItem[]): QueueState {
  return { ...q, tracks: [...q.tracks, ...tracks] };
}

/** Insert a track right after the current one ("play next"). */
export function enqueueNext(q: QueueState, track: JellyfinItem): QueueState {
  if (!q.tracks.length) return { tracks: [track], index: 0 };
  const tracks = [...q.tracks];
  tracks.splice(q.index + 1, 0, track);
  return { ...q, tracks };
}

/** Remove the track at `at`. Removing before the current keeps it playing (index
 * shifts down); removing the current or a later one leaves the index clamped. */
export function removeAt(q: QueueState, at: number): QueueState {
  if (at < 0 || at >= q.tracks.length) return q;
  const tracks = q.tracks.filter((_, i) => i !== at);
  let index = q.index;
  if (at < q.index) index = q.index - 1;
  index = Math.max(0, Math.min(index, tracks.length - 1));
  return { tracks, index };
}

// Shuffle helpers live in queueShuffle.ts (line gate); re-exported so `queue`
// stays the one import surface for queue logic.
export { startShuffled, shuffleRest, unshuffle } from './queueShuffle';
