import { setPendingSeek } from './pendingSeek';

/**
 * Stash the element's position as a one-shot pending seek before an error/stall
 * reload wipes it. startPlayback resets the element to 0 on a new src; without
 * this, a stall deep into an audiobook restarted it at 0 — and the 10s progress
 * tick then PERSISTED that 0 to the server, losing the place in the book
 * permanently. Consumed by useAudiobookResume once the reload's metadata lands,
 * restoring the exact position for any track type. Positions ≤ 1s aren't worth
 * preserving (indistinguishable from a fresh start).
 */
export function preserveReloadPosition(
  trackId: string | undefined,
  audio: HTMLAudioElement | null,
): void {
  const pos = audio?.currentTime ?? 0;
  if (trackId && pos > 1) setPendingSeek(trackId, pos);
}
