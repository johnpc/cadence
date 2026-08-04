import { useEffect } from 'react';
import { getPlayIntent } from './playIntentStore';
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
 * On the native-dispatched event we re-assert playback ONLY when the user still
 * INTENDS to be playing — so we recover the interrupted track but never override
 * a deliberate pause. We read PLAY INTENT, not `isPlaying`: the interruption
 * itself fires a 'pause' that flips `isPlaying` to false, so gating on `isPlaying`
 * cancelled the very resume it should trigger (music never came back after a
 * call). Intent is set on real play and cleared only on deliberate pause/stop
 * (see playIntentStore), so it survives the interruption. Inert on web (no event).
 */
export function useAudioInterruptionResume(resume: () => void): void {
  useEffect(() => {
    const onEnded = () => {
      const intended = getPlayIntent();
      log('interruption', 'native resume nudge', { intended: String(intended) });
      if (intended) resume();
    };
    window.addEventListener(AUDIO_INTERRUPTION_ENDED, onEnded);
    return () => window.removeEventListener(AUDIO_INTERRUPTION_ENDED, onEnded);
  }, [resume]);
}
