import { useMemo, useRef, type ReactNode } from 'react';
import { PlayerContext } from './PlayerContext';
import { PlayerProgressContext } from './PlayerProgressContext';
import { useAudioElement } from './useAudioElement';
import { usePlayerQueue } from './usePlayerQueue';
import { useSleepTimer } from './useSleepTimer';
import { useSleepAtTrackEnd } from './useSleepAtTrackEnd';
import { usePlayerIntegrations } from './usePlayerIntegrations';
import { usePlaybackHandlers } from './usePlaybackHandlers';
import { useVolume } from './useVolume';
import { usePlaybackControls } from './usePlaybackControls';
import { usePlaybackReporting } from './usePlaybackReporting';
import { useEndlessPlay } from './useEndlessPlay';
import { useNextTrackPrefetch } from './useNextTrackPrefetch';
import { useAutoplay } from '../settings/useAutoplay';
import { useDocumentTitle } from './useDocumentTitle';
import { buildPlayerValue } from './playerValue';
import { useTrackLoader } from './useTrackLoader';
import { useToast } from '../toast/useToast';
import * as q from './queue';

/** Holds the play queue + the one audio element, exposing player controls. */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const qh = usePlayerQueue();
  const toast = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // "Stop after this track" sleep timer: the ended-handler reads these refs and
  // pauses+disarms on a natural track end (see useSleepAtTrackEnd).
  const sleepEnd = useSleepAtTrackEnd();

  const { onEnded, onError } = usePlaybackHandlers(qh, audioRef, toast, sleepEnd);
  const { ref, isPlaying, waiting, position, duration } = useAudioElement(onEnded, onError);
  audioRef.current = ref.current;

  const current = q.currentTrack(qh.queue);
  const currentId = current?.Id;
  const { volume, setVolume, nudgeVolume, toggleMute } = useVolume(ref, currentId);

  // Load the current track and play on change (restored tracks stay paused).
  useTrackLoader(ref, current ?? undefined);

  const { toggle, seek, seekBy, pause } = usePlaybackControls(ref, qh.queue.tracks.length > 0);

  // Report playback to Jellyfin (play counts + Recently Played). Reads position
  // live from the audio element so it doesn't re-fire on every tick.
  usePlaybackReporting(currentId, () => ref.current?.currentTime ?? 0);

  // Endless play: append instant-mix radio when the queue ends (unless the user
  // turned Autoplay off, or repeat is on — then the queue loops instead).
  const { autoplay } = useAutoplay();
  useEndlessPlay(qh.queue.tracks, qh.queue.index, autoplay && qh.repeat === 'off', qh.addToQueue);

  // Warm the next track (web audio path only) so transitions are near-gapless.
  useNextTrackPrefetch(qh.queue, qh.repeat === 'all', isPlaying);

  // Reflect the playing track in the browser tab title.
  useDocumentTitle(current);

  // Sleep timer: pause when it elapses (timed) or when the track ends ('track').
  const { sleepMode, armSleep } = useSleepTimer(pause, sleepEnd.active);
  sleepEnd.setOnReached(() => {
    pause();
    armSleep(null);
  });

  const audioControls = { toggle, seek, seekBy, nudgeVolume, toggleMute };
  usePlayerIntegrations(current, isPlaying, qh, audioControls, position, duration);

  // The main value excludes the fast-changing position/duration (those live in
  // PlayerProgressContext), so it only changes on real state transitions —
  // memoize it so a play/pause tick doesn't re-render every TrackRow in a list.
  const value = useMemo(
    () =>
      buildPlayerValue(qh, current, {
        isPlaying,
        waiting,
        toggle,
        seek,
        sleepMode,
        armSleep,
        volume,
        setVolume,
      }),
    [qh, current, isPlaying, waiting, toggle, seek, sleepMode, armSleep, volume, setVolume],
  );

  // Progress ticks several times a second — its own context so only the
  // scrubbers (NowPlayingBar, FullPlayer) re-render on each tick.
  const progress = useMemo(() => ({ position, duration }), [position, duration]);

  return (
    <PlayerContext.Provider value={value}>
      <PlayerProgressContext.Provider value={progress}>{children}</PlayerProgressContext.Provider>
    </PlayerContext.Provider>
  );
}
