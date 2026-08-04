import { getCastState } from '../cast/castStore';
import { castToggle } from '../cast/castController';
import { setPlayIntent } from './playIntentStore';
import { log } from '../../lib/diagnostics/diagnosticsStore';

/** Directional transport primitives shared by the in-app buttons and the OS
 * lock-screen / Bluetooth controls. Kept pure(ish) and separate from the hook so
 * usePlaybackControls stays under the line gate and these stay unit-testable.
 *
 * Unlike a toggle, these take an explicit direction — the lock screen tells us
 * which action it wants, so we must NOT re-derive it from `isPlaying`, which iOS
 * desyncs after an interruption (the "first lock-screen play does nothing, works
 * only after a manual pause" bug). While casting, transport proxies to the TV. */

/** Start playback (lock-screen play, resume-after-interruption). Plays the local
 * element unconditionally — safe if already playing, and it recovers the iOS
 * post-interruption state where `paused` is false yet no sound comes out. Records
 * play intent so a later interruption knows to auto-resume. */
export function playAudio(audio: HTMLAudioElement | null): void {
  setPlayIntent(true);
  if (getCastState().connected) {
    void castToggle().catch(() => undefined);
    return;
  }
  void audio?.play().catch((e: unknown) => {
    log('play-rejected', 'explicit play() rejected', {
      reason: e instanceof Error ? e.name : 'unknown',
    });
  });
}

/** Pause playback (lock-screen pause, in-app pause). Clears play intent — this is
 * a DELIBERATE stop, so a subsequent OS interruption must not auto-resume it. */
export function pauseAudio(audio: HTMLAudioElement | null): void {
  setPlayIntent(false);
  if (getCastState().connected) {
    void castToggle().catch(() => undefined);
    return;
  }
  audio?.pause();
}
