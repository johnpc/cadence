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

// The 'play' event can fire in bursts — a user start, the element re-firing as it
// resumes from a buffering stall, plus every resume()/track-load play() call. Each
// post makes native re-assert the audio session; doing that many times a second
// added needless churn (and, with the old always-setCategory handler, audible
// mid-song pauses). Throttle to at most one post per window so native re-asserts
// on genuine starts without thrashing.
const NOTIFY_THROTTLE_MS = 1000;
let lastNotify = 0;

/** Tell native "playback started" so it re-asserts the audio session. Safe to
 * call on every play (throttled internally); a no-op when the native handler
 * isn't present. `now` is injectable for tests. */
export function notifyNativePlaybackStarted(now: number = Date.now()): void {
  if (now - lastNotify < NOTIFY_THROTTLE_MS) return;
  const webkit = (window as unknown as { webkit?: WebkitBridge }).webkit;
  const handler = webkit?.messageHandlers?.cadenceAudioSession;
  if (!handler) return; // web/Android — don't advance the throttle clock
  lastNotify = now;
  try {
    handler.postMessage('play');
  } catch {
    /* posting failed — ignore */
  }
}
