import { useMemo, useRef, type ReactNode } from 'react';
import { PlayerContext } from './PlayerContext';
import { PlayerProgressContext } from './PlayerProgressContext';
import { useAudioElement } from './useAudioElement';
import { usePlayerQueue } from './usePlayerQueue';
import { useSleepTimer } from './useSleepTimer';
import { usePlayerIntegrations } from './usePlayerIntegrations';
import { usePlaybackHandlers } from './usePlaybackHandlers';
import { useVolume } from './useVolume';
import { usePlaybackControls } from './usePlaybackControls';
import { usePlaybackReporting } from './usePlaybackReporting';
import { useEndlessPlay } from './useEndlessPlay';
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

  const { onEnded, onError } = usePlaybackHandlers(qh, audioRef, toast);
  const { ref, isPlaying, position, duration } = useAudioElement(onEnded, onError);
  audioRef.current = ref.current;

  const current = q.currentTrack(qh.queue);
  const currentId = current?.Id;
  const { volume, setVolume, nudgeVolume, toggleMute } = useVolume(ref, currentId);

  // Load the current track and play on change (restored tracks stay paused).
  useTrackLoader(ref, currentId);

  const { toggle, seek, pause } = usePlaybackControls(ref, qh.queue.tracks.length > 0);

  // Report playback to Jellyfin (play counts + Recently Played). Reads position
  // live from the audio element so it doesn't re-fire on every tick.
  usePlaybackReporting(currentId, () => ref.current?.currentTime ?? 0);

  // Endless play: append instant-mix radio when the queue reaches its end.
  useEndlessPlay(qh.queue.tracks, qh.queue.index, qh.repeat === 'off', qh.addToQueue);

  // Reflect the playing track in the browser tab title.
  useDocumentTitle(current);

  // Sleep timer: pause when it elapses.
  const { sleepMinutes, armSleep } = useSleepTimer(pause);

  usePlayerIntegrations(current, isPlaying, {
    toggle,
    next: qh.next,
    prev: qh.prev,
    nudgeVolume,
    toggleMute,
    toggleShuffle: qh.toggleShuffle,
    cycleRepeat: qh.cycleRepeat,
  });

  // The main value excludes the fast-changing position/duration (those live in
  // PlayerProgressContext), so it only changes on real state transitions —
  // memoize it so a play/pause tick doesn't re-render every TrackRow in a list.
  const value = useMemo(
    () =>
      buildPlayerValue(qh, current, {
        isPlaying,
        toggle,
        seek,
        sleepMinutes,
        armSleep,
        volume,
        setVolume,
      }),
    [qh, current, isPlaying, toggle, seek, sleepMinutes, armSleep, volume, setVolume],
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
