/**
 * Persistence + default for the "Offline mode" preference (localStorage,
 * per-device). When ON, Cadence behaves as if there is no server even if one is
 * reachable — it stops all network calls and shows only your downloaded content
 * (the iPod-style offline library). OFF by default; combined with real
 * reachability by useEffectiveOffline.
 */
const FORCE_OFFLINE_KEY = 'cadence.forceOffline';

// Emitted so an open Settings toggle, the shell, and the player stay in sync in
// one tab (the `storage` event only fires cross-tab).
const listeners = new Set<(on: boolean) => void>();

export function readForceOffline(): boolean {
  return localStorage.getItem(FORCE_OFFLINE_KEY) === 'on';
}

export function writeForceOffline(on: boolean): void {
  localStorage.setItem(FORCE_OFFLINE_KEY, on ? 'on' : 'off');
  listeners.forEach((l) => l(on));
}

export function onForceOfflineChange(listener: (on: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
