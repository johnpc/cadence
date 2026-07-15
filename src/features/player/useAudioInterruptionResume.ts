import { useEffect, useRef } from 'react';
import { log } from '../../lib/diagnostics/diagnosticsStore';

/** The event the native layer dispatches on `window` to nudge the web player to
 * re-assert playback: after an OS audio interruption (Siri, a phone call) ENDS
 * with the "should resume" hint, AND when the app returns to the foreground (a
 * safety net — Siri's interruption-ended notification is unreliable in a
 * WKWebView). AppDelegate fires both through this one event. */
export const AUDIO_INTERRUPTION_ENDED = 'cadence:audiointerruptionended';

/**
 * Recover playback after an OS audio interruption. Invoking Siri or taking a
 * call stops the WKWebView's audio and iOS never auto-resumes it — worse, it
 * often leaves `audio.paused === false` with no 'pause' event, so the UI still
 * shows "playing" but no sound comes out, and the user must pause+play to fix it.
 *
 * On the native-dispatched event we re-assert playback ONLY when the player still
 * INTENDS to be playing (`isPlaying`) — so we recover the interrupted track but
 * never override a deliberate pause. `isPlaying` is read through a ref so the
 * listener isn't re-subscribed on every play/pause. Inert on the web (no event).
 */
export function useAudioInterruptionResume(isPlaying: boolean, resume: () => void): void {
  const intendedRef = useRef(isPlaying);
  intendedRef.current = isPlaying;
  useEffect(() => {
    const onEnded = () => {
      log('interruption', 'native resume nudge', { intended: String(intendedRef.current) });
      if (intendedRef.current) resume();
    };
    window.addEventListener(AUDIO_INTERRUPTION_ENDED, onEnded);
    return () => window.removeEventListener(AUDIO_INTERRUPTION_ENDED, onEnded);
  }, [resume]);
}
