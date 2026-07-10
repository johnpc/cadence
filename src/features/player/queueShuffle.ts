/**
 * Shuffle helpers for the play queue — split from queue.ts for the line gate.
 * All pure (injected randomness) so they're deterministic in tests.
 */
import { currentTrack, type QueueState } from './queue';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

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

/** Shuffle the upcoming tracks, keeping the current one first (index 0), and
 * snapshot the pre-shuffle order (once) so shuffle-off can restore it. */
export function shuffleRest(q: QueueState, rand: () => number): QueueState {
  const current = currentTrack(q);
  if (!current) return q;
  const rest = q.tracks.filter((_, i) => i !== q.index);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return { tracks: [current, ...rest], index: 0, unshuffled: q.unshuffled ?? q.tracks };
}

/** Restore the pre-shuffle order (Spotify-style shuffle-off), keeping the
 * current track selected. No-op if no snapshot exists. */
export function unshuffle(q: QueueState): QueueState {
  if (!q.unshuffled) return q;
  const current = currentTrack(q);
  const index = current ? q.unshuffled.indexOf(current) : -1;
  return { tracks: q.unshuffled, index: index >= 0 ? index : 0 };
}
