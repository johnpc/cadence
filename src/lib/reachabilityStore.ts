/**
 * Server reachability as a tiny observable store — the source of truth for "are
 * we online?". Offline-FIRST: we start `pending` (not confirmed online) and only
 * flip to `online` once a real Jellyfin request actually succeeds, so nothing
 * has to wait on a slow/optimistic probe before offline UI kicks in. iOS is the
 * reason navigator.onLine isn't enough — a WKWebView reports `onLine: true` on a
 * dead connection, so trusting it would hide the offline state entirely.
 *
 * - markReachable(): the server responded (ANY status, incl. 401/404 — the box
 *   is reachable). → `online`.
 * - markUnreachable(): a request network-failed or timed out. → `offline`.
 * - The browser `offline` event (reliable when false) → `offline`; the `online`
 *   event is optimistic, so it only downgrades us to `pending` (a real request
 *   then confirms `online`), never straight to online.
 */
export type Reachability = 'pending' | 'online' | 'offline';

// navigator.onLine === false is reliable, so seed `offline` from it; otherwise
// stay `pending` until a request proves reachability (offline-first default).
let state: Reachability =
  typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'pending';

const listeners = new Set<() => void>();

function set(next: Reachability): void {
  if (next === state) return;
  state = next;
  for (const l of listeners) l();
}

/** The server responded — we're online. Called by jellyfinFetch on any HTTP
 * response (even an error status: the server was reachable). */
export function markReachable(): void {
  set('online');
}

/** A request failed to reach the server (network error / timeout). */
export function markUnreachable(): void {
  set('offline');
}

/** Current reachability. */
export function getReachability(): Reachability {
  return state;
}

/** Subscribe to reachability changes; returns an unsubscribe. Wires the browser
 * connectivity events on first subscribe (kept lazy so importing the store has
 * no side effects — matters for unit tests). */
export function onReachabilityChange(listener: () => void): () => void {
  if (listeners.size === 0) attachBrowserEvents();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) detachBrowserEvents();
  };
}

const onBrowserOffline = () => set('offline');
// Don't trust the optimistic `online` event to mean reachable — just clear a
// confirmed-offline back to pending so pages retry; a request confirms online.
const onBrowserOnline = () => set(state === 'offline' ? 'pending' : state);

function attachBrowserEvents(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('offline', onBrowserOffline);
  window.addEventListener('online', onBrowserOnline);
}

function detachBrowserEvents(): void {
  if (typeof window === 'undefined') return;
  window.removeEventListener('offline', onBrowserOffline);
  window.removeEventListener('online', onBrowserOnline);
}

/** Test-only: reset module state between cases. */
export function __resetReachability(): void {
  state = typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'pending';
  listeners.clear();
}
