/**
 * The receiver's playback position while casting, kept in its own tiny store
 * (it ticks often — same reason PlayerProgressContext is separate from the main
 * player value). Fed from the Cast plugin's MEDIA_UPDATE events; read by the
 * player so the scrubber reflects the TV, not the paused local audio element.
 */
export interface CastProgress {
  position: number;
  duration: number;
}

let progress: CastProgress = { position: 0, duration: 0 };
const listeners = new Set<() => void>();

export function getCastProgress(): CastProgress {
  return progress;
}

export function setCastProgress(next: CastProgress): void {
  progress = next;
  for (const l of listeners) l();
}

export function onCastProgressChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
