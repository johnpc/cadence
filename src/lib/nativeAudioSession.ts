/**
 * Nudge the native iOS layer to (re)activate the AVAudioSession the moment web
 * playback actually starts. iOS can silently drop or fail to hold the session
 * activated at app launch (before any audio exists), which lets the WKWebView's
 * <audio> get suspended when the app is backgrounded or the screen locks — so
 * playback stops. Activating the session on each real play() keeps it alive for
 * background playback.
 *
 * Implemented as a one-way WKScriptMessageHandler post (see the iOS
 * MainViewController). Inert everywhere else — on web/Android the message handler
 * doesn't exist, so this is a no-op.
 */
interface AudioSessionMessageHandler {
  postMessage: (message: unknown) => void;
}

interface WebkitBridge {
  messageHandlers?: { cadenceAudioSession?: AudioSessionMessageHandler };
}

/** Tell native "playback started" so it re-asserts the audio session. Safe to
 * call on every play; a no-op when the native handler isn't present. */
export function notifyNativePlaybackStarted(): void {
  const webkit = (window as unknown as { webkit?: WebkitBridge }).webkit;
  try {
    webkit?.messageHandlers?.cadenceAudioSession?.postMessage('play');
  } catch {
    /* handler not registered (web/Android) — ignore */
  }
}
