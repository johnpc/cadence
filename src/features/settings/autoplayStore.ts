/** Persistence + default for the "Autoplay" preference (localStorage, per-device).
 * Autoplay = keep playing similar songs (instant-mix radio) when the queue ends,
 * Spotify-style. On by default; users can turn the endless radio off here. */
const AUTOPLAY_KEY = 'cadence.autoplay';

/** Emitted so an open Settings toggle and the player stay in sync in one tab
 * (the `storage` event only fires cross-tab). */
const listeners = new Set<(on: boolean) => void>();

export function readAutoplay(): boolean {
  // Default ON: only an explicit 'off' disables it.
  return localStorage.getItem(AUTOPLAY_KEY) !== 'off';
}

export function writeAutoplay(on: boolean): void {
  localStorage.setItem(AUTOPLAY_KEY, on ? 'on' : 'off');
  listeners.forEach((l) => l(on));
}

export function onAutoplayChange(listener: (on: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
