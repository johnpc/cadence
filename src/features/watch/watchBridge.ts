import type { WatchState } from './watchTypes';

/**
 * Push now-playing state to the native layer, which relays it to the paired
 * Apple Watch via WatchConnectivity. One-way WKScriptMessageHandler post (see
 * MainViewController's "cadenceWatch" handler). Inert on web/Android where the
 * handler is absent, so it's a safe no-op everywhere but native iOS.
 */
interface WatchMessageHandler {
  postMessage: (message: unknown) => void;
}

interface WebkitBridge {
  messageHandlers?: { cadenceWatch?: WatchMessageHandler };
}

/** True when the native watch bridge is present (native iOS). */
export function hasWatchBridge(): boolean {
  const webkit = (window as unknown as { webkit?: WebkitBridge }).webkit;
  return !!webkit?.messageHandlers?.cadenceWatch;
}

/** Send the latest now-playing state to native → watch. No-op off native. */
export function pushWatchState(state: WatchState): void {
  const webkit = (window as unknown as { webkit?: WebkitBridge }).webkit;
  const handler = webkit?.messageHandlers?.cadenceWatch;
  if (!handler) return;
  try {
    handler.postMessage(JSON.stringify(state));
  } catch {
    /* posting failed — the watch keeps its last state */
  }
}
