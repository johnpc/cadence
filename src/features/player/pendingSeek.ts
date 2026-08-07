/**
 * A one-shot "seek to this position once the track loads" request, keyed by item
 * id. Used when starting playback at a specific timestamp for a track that isn't
 * loaded yet — e.g. tapping a chapter on a single-file audiobook's detail page:
 * we start the book, then seek to the chapter's start once the audio element
 * reports metadata (useAudiobookResume consumes it). Module-scoped + in-memory
 * (session-only); a request is consumed exactly once so it can't re-fire on a
 * later reload of the same track.
 */
interface PendingSeek {
  id: string;
  seconds: number;
}

let pending: PendingSeek | null = null;

/** Request a seek to `seconds` the next time item `id` loads. Replaces any prior
 * pending request (only the most recent tap matters). */
export function setPendingSeek(id: string, seconds: number): void {
  pending = { id, seconds };
}

/** Consume the pending seek for `id` if one is set for exactly that item — returns
 * the target seconds and clears it, so it fires once. Returns null otherwise (and
 * leaves a pending seek for a different id in place). */
export function takePendingSeek(id: string | undefined): number | null {
  if (!pending || !id || pending.id !== id) return null;
  const { seconds } = pending;
  pending = null;
  return seconds;
}
