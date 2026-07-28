/**
 * Live per-track download progress (0..1), as a tiny observable map. Separate
 * from the persisted download index (downloadIndex) because progress is
 * ephemeral — it only exists while bytes are in flight and never needs to
 * survive a reload. Any row/badge can subscribe to reflect a track's %.
 */
const progress = new Map<string, number>();
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

/** Set a track's download fraction (0..1). Clamped. */
export function setProgress(id: string, fraction: number): void {
  progress.set(id, Math.max(0, Math.min(1, fraction)));
  emit();
}

/** Clear a track's progress entry (on completion or failure). */
export function clearProgress(id: string): void {
  if (progress.delete(id)) emit();
}

/** A track's current download fraction, or undefined if not downloading. */
export function getProgress(id: string): number | undefined {
  return progress.get(id);
}

/** Subscribe to any progress change; returns an unsubscribe. */
export function onProgressChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Test-only: reset module state between cases. */
export function __resetProgress(): void {
  progress.clear();
  listeners.clear();
}
