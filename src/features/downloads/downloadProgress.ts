import { createStore } from '../../lib/store';

/**
 * Live per-track download progress (0..1). Separate from the persisted download
 * index because progress is ephemeral — it only exists while bytes are in
 * flight and never needs to survive a reload. Any row/badge can subscribe.
 */
export const downloadProgressStore = createStore<ReadonlyMap<string, number>>(new Map());

/** Set a track's download fraction (0..1). Clamped. */
export function setProgress(id: string, fraction: number): void {
  downloadProgressStore.update((m) => new Map(m).set(id, Math.max(0, Math.min(1, fraction))));
}

/** Clear a track's progress entry (on completion or failure). */
export function clearProgress(id: string): void {
  downloadProgressStore.update((m) => {
    if (!m.has(id)) return m;
    const next = new Map(m);
    next.delete(id);
    return next;
  });
}

/** A track's current download fraction, or undefined if not downloading. */
export const getProgress = (id: string): number | undefined => downloadProgressStore.get().get(id);

/** Subscribe to any progress change; returns an unsubscribe. */
export const onProgressChange = (listener: () => void): (() => void) =>
  downloadProgressStore.subscribe(listener);

/** Test-only: reset module state between cases. */
export function __resetProgress(): void {
  downloadProgressStore.set(new Map());
}
