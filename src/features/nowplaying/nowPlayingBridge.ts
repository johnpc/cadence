import type { NowPlayingState } from './nowPlayingTypes';

/**
 * Push now-playing state to the native iOS layer, which mirrors it onto
 * MPNowPlayingInfoCenter + MPRemoteCommandCenter so Cadence stays the durable OS
 * Now Playing app (survives pause/background/route changes). One-way
 * WKScriptMessageHandler post (see MainViewController's "cadenceNowPlaying"
 * handler). Inert on web/Android where the handler is absent — a safe no-op
 * everywhere but the native iOS app.
 */
interface NowPlayingMessageHandler {
  postMessage: (message: unknown) => void;
}

interface WebkitBridge {
  messageHandlers?: { cadenceNowPlaying?: NowPlayingMessageHandler };
}

/** True when the native now-playing bridge is present (native iOS build). When
 * true, native owns the OS now-playing surface and the web MediaSession must
 * stand down to avoid two owners fighting over the same transport commands. */
export function hasNowPlayingBridge(): boolean {
  const webkit = (window as unknown as { webkit?: WebkitBridge }).webkit;
  return !!webkit?.messageHandlers?.cadenceNowPlaying;
}

/** Send the latest now-playing state to native → MPNowPlayingInfoCenter. No-op
 * off native iOS. */
export function pushNowPlayingState(state: NowPlayingState): void {
  const webkit = (window as unknown as { webkit?: WebkitBridge }).webkit;
  const handler = webkit?.messageHandlers?.cadenceNowPlaying;
  if (!handler) return;
  try {
    handler.postMessage(JSON.stringify(state));
  } catch {
    /* posting failed — native keeps its last state */
  }
}
