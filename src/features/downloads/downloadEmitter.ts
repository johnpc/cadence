/**
 * The downloads-changed pub/sub, split out so downloadStore stays lean. Fires
 * whenever a track is added to or removed from the offline index, driving every
 * reactive download UI (the Downloads screen, buttons, badges).
 */
const listeners = new Set<() => void>();

/** Notify all subscribers that the downloaded set changed. */
export function emitDownloadsChange(): void {
  for (const l of listeners) l();
}

/** Subscribe to download add/remove events (drives reactive UI). */
export function onDownloadsChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
