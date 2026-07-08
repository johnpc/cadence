import type { QueueState } from './queue';
import { EMPTY_QUEUE } from './queue';

const KEY = 'cadence.queue';
const MAX = 200;

/** Load the persisted queue (tracks + index) so playback survives a reload.
 * Returns the empty queue when nothing valid is stored. */
export function loadQueue(): QueueState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_QUEUE;
    const parsed = JSON.parse(raw) as QueueState;
    if (!parsed || !Array.isArray(parsed.tracks)) return EMPTY_QUEUE;
    const tracks = parsed.tracks.filter((t) => t && t.Id && t.Name);
    if (!tracks.length) return EMPTY_QUEUE;
    const index = Math.max(0, Math.min(parsed.index ?? 0, tracks.length - 1));
    return { tracks, index };
  } catch {
    return EMPTY_QUEUE;
  }
}

/** Persist the queue (capped) so it can be restored next launch. */
export function saveQueue(state: QueueState): void {
  try {
    if (!state.tracks.length) {
      localStorage.removeItem(KEY);
      return;
    }
    const tracks = state.tracks.slice(0, MAX);
    const index = Math.min(state.index, tracks.length - 1);
    localStorage.setItem(KEY, JSON.stringify({ tracks, index }));
  } catch {
    // Storage full / unavailable — persistence is best-effort.
  }
}
