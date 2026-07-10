import type { QueueState } from './queue';
import { EMPTY_QUEUE } from './queue';

const KEY = 'cadence.queue';
const MAX = 200;

/** Load the persisted queue (tracks + index, plus the pre-shuffle order if the
 * queue was shuffled) so playback — and shuffle-off restore — survive a reload.
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
    // Restore the pre-shuffle snapshot too, so toggling shuffle off after a
    // reload still returns to the original order (it was lost before).
    const unshuffled = Array.isArray(parsed.unshuffled)
      ? parsed.unshuffled.filter((t) => t && t.Id && t.Name)
      : undefined;
    return unshuffled?.length ? { tracks, index, unshuffled } : { tracks, index };
  } catch {
    return EMPTY_QUEUE;
  }
}

/** Persist the queue (capped) so it can be restored next launch. Keeps the
 * pre-shuffle order (also capped) so shuffle-off works across reloads. */
export function saveQueue(state: QueueState): void {
  try {
    if (!state.tracks.length) {
      localStorage.removeItem(KEY);
      return;
    }
    const tracks = state.tracks.slice(0, MAX);
    const index = Math.min(state.index, tracks.length - 1);
    const payload: QueueState = { tracks, index };
    if (state.unshuffled?.length) payload.unshuffled = state.unshuffled.slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // Storage full / unavailable — persistence is best-effort.
  }
}
