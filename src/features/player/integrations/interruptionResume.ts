import { log } from '../../../lib/diagnostics/diagnosticsStore';
import type { PlayerEngine } from '../engine/types';

/** The event the native layer dispatches on `window` to nudge the web player to
 * re-assert playback: when an OS audio interruption (Siri, a call) ENDS with
 * "should resume", and when the app returns to the foreground (a safety net —
 * Siri's interruption-ended notification is unreliable in a WKWebView). */
export const AUDIO_INTERRUPTION_ENDED = 'cadence:audiointerruptionended';

/**
 * Recover playback after an OS interruption. iOS stops the WKWebView's audio
 * and never resumes it — often leaving `paused === false` with no 'pause'
 * event, so the UI says "playing" in silence. Resume ONLY while the user still
 * INTENDS to play: the interruption itself fires a 'pause', so the transport
 * reads paused, but `intent` (cleared only by a deliberate pause/stop) survives.
 * Inert on the web (the event never fires).
 */
export function attachInterruptionResume(
  engine: Pick<PlayerEngine, 'state' | 'resume'>,
): () => void {
  const onEnded = () => {
    const intended = engine.state.get().intent;
    log('interruption', 'native resume nudge', { intended: String(intended) });
    if (intended) engine.resume();
  };
  window.addEventListener(AUDIO_INTERRUPTION_ENDED, onEnded);
  return () => window.removeEventListener(AUDIO_INTERRUPTION_ENDED, onEnded);
}
