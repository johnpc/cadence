import { useRef, type ReactNode } from 'react';
import { PlayerContext } from './PlayerContext';
import { PlayerProgressContext } from './PlayerProgressContext';
import { useAudioElement } from './useAudioElement';
import { usePlayerQueue } from './usePlayerQueue';
import { useSleepTimer } from './useSleepTimer';
import { useSleepAtTrackEnd } from './useSleepAtTrackEnd';
import { usePlayerIntegrations } from './usePlayerIntegrations';
import { usePlaybackHandlers } from './usePlaybackHandlers';
import { useVolume } from './useVolume';
import { usePlaybackRate } from './usePlaybackRate';
import { usePlaybackControls } from './usePlaybackControls';
import { usePlayerSideEffects } from './usePlayerSideEffects';
import { usePlayerValue } from './usePlayerValue';
import { useTrackLoader } from './useTrackLoader';
import { useTrackReload } from './useTrackReload';
import { useToast } from '../toast/useToast';
import { useEffectiveProgress } from '../cast/useEffectiveProgress';
import { useSmartPrev } from './useSmartPrev';
import { useAudioInterruptionResume } from './useAudioInterruptionResume';
import { useDiagnosticsContext } from './useDiagnosticsContext';
import * as q from './queue';

/** Holds the play queue + the one audio element, exposing player controls. */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const qh = usePlayerQueue();
  const toast = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // "Stop after this track" sleep timer: the ended-handler reads these refs and
  // pauses+disarms on a natural track end (see useSleepAtTrackEnd).
  const sleepEnd = useSleepAtTrackEnd();

  // Reload/retry the current track on a load error (bumps a nonce the loader
  // depends on) before giving up + skipping.
  const { nonce: reloadNonce, requestReload, resetFor } = useTrackReload();
  const { onEnded, onError } = usePlaybackHandlers(qh, audioRef, toast, sleepEnd, requestReload);
  const { ref, isPlaying, waiting, position, duration } = useAudioElement(onEnded, onError);
  audioRef.current = ref.current;

  const current = q.currentTrack(qh.queue);
  const currentId = current?.Id;
  resetFor(currentId); // clear the retry counter when the track changes
  const { volume, setVolume, nudgeVolume, toggleMute } = useVolume(ref, currentId);
  const { rate, setRate } = usePlaybackRate(ref, currentId);

  // Load the current track and play on change (restored tracks stay paused);
  // reloadNonce forces a re-derive+retry after a load error.
  useTrackLoader(ref, current ?? undefined, reloadNonce);

  const hasQueue = qh.queue.tracks.length > 0;
  const { toggle, seek, seekBy, pause, resume } = usePlaybackControls(ref, hasQueue, isPlaying);
  // Recover from an OS audio interruption (Siri / call) if still meant to play.
  useAudioInterruptionResume(isPlaying, resume);
  // Tag every diagnostic line with the current track + platform (and log changes).
  useDiagnosticsContext(current);

  // Smart "previous": restart mid-track, else go to the prior track.
  const qc = { ...qh, prev: useSmartPrev(ref, seek, qh.prev) };

  // Fire-and-forget integrations: play reporting, endless radio, next-track
  // prefetch, tab title (see usePlayerSideEffects).
  usePlayerSideEffects(qh, current, currentId, ref, isPlaying);

  // Sleep timer: pause when it elapses (timed) or when the track ends ('track').
  const { sleepMode, armSleep } = useSleepTimer(pause, sleepEnd.active);
  sleepEnd.setOnReached(() => {
    pause();
    armSleep(null);
  });

  const audioControls = { toggle, seek, seekBy, nudgeVolume, toggleMute };
  usePlayerIntegrations(current, isPlaying, qc, audioControls, position, duration);

  const value = usePlayerValue(qc, current, {
    isPlaying,
    waiting,
    toggle,
    seek,
    sleepMode,
    armSleep,
    volume,
    setVolume,
    rate,
    setRate,
  });

  // Progress ticks several times a second — its own context so only the
  // scrubbers (NowPlayingBar, FullPlayer) re-render on each tick. While casting,
  // it reflects the receiver's position (the local audio is paused then).
  const progress = useEffectiveProgress(position, duration);

  return (
    <PlayerContext.Provider value={value}>
      <PlayerProgressContext.Provider value={progress}>{children}</PlayerProgressContext.Provider>
    </PlayerContext.Provider>
  );
}
