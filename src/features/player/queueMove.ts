/**
 * Pure queue reordering — kept out of queue.ts to respect the ≤100-line gate.
 * Moving a track must keep the *currently playing* track selected: we track it
 * by identity across the move and recompute the index, so reordering never
 * interrupts playback.
 */
import type { QueueState } from './queue';

/** Move the track at `from` to `to` (both clamped). The playing track stays
 * selected — its new position becomes the new index. */
export function moveAt(q: QueueState, from: number, to: number): QueueState {
  const n = q.tracks.length;
  if (from < 0 || from >= n) return q;
  const dest = Math.max(0, Math.min(to, n - 1));
  if (dest === from) return q;
  const playing = q.tracks[q.index];
  const tracks = [...q.tracks];
  const [moved] = tracks.splice(from, 1);
  tracks.splice(dest, 0, moved);
  return { tracks, index: tracks.indexOf(playing) };
}
