import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { PlayerContext } from './PlayerContext';
import { useAudioElement } from './useAudioElement';
import { useMediaSessionSync } from './useMediaSessionSync';
import { usePlayerQueue } from './usePlayerQueue';
import { useSleepTimer } from './useSleepTimer';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useVolume } from './useVolume';
import { usePlaybackControls } from './usePlaybackControls';
import { usePlaybackReporting } from './usePlaybackReporting';
import { useEndlessPlay } from './useEndlessPlay';
import { buildPlayerValue } from './playerValue';
import { audioStreamUrl } from '../../lib/jellyfinStream';
import * as q from './queue';

/** Holds the play queue + the one audio element, exposing player controls. */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const qh = usePlayerQueue();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // On track end, apply the repeat rule; 'one' restarts the same element.
  const onEnded = useCallback(() => {
    qh.advance(() => {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        void audio.play().catch(() => undefined);
      }
    });
  }, [qh]);

  const { ref, isPlaying, position, duration } = useAudioElement(onEnded);
  audioRef.current = ref.current;

  const current = q.currentTrack(qh.queue);
  const currentId = current?.Id;
  const { volume, setVolume } = useVolume(ref, currentId);

  // Load + play whenever the current track changes.
  useEffect(() => {
    const audio = ref.current;
    if (!audio || !currentId) return;
    audio.src = audioStreamUrl(currentId);
    void audio.play().catch(() => undefined);
  }, [currentId, ref]);

  const { toggle, seek, pause } = usePlaybackControls(ref, qh.queue.tracks.length > 0);

  // Report playback to Jellyfin (play counts + Recently Played). Reads position
  // live from the audio element so it doesn't re-fire on every tick.
  usePlaybackReporting(currentId, () => ref.current?.currentTime ?? 0);

  // Endless play: append instant-mix radio when the queue reaches its end.
  useEndlessPlay(qh.queue.tracks, qh.queue.index, qh.repeat === 'off', qh.addToQueue);

  // Sleep timer: pause when it elapses.
  const { sleepMinutes, armSleep } = useSleepTimer(pause);

  const mediaHandlers = useMemo(
    () => ({ play: toggle, pause: toggle, next: qh.next, prev: qh.prev }),
    [toggle, qh.next, qh.prev],
  );
  useMediaSessionSync(current, isPlaying, mediaHandlers);
  useKeyboardShortcuts(
    useMemo(() => ({ toggle, next: qh.next, prev: qh.prev }), [toggle, qh.next, qh.prev]),
    !!current,
  );

  const value = buildPlayerValue(qh, current, {
    isPlaying,
    position,
    duration,
    toggle,
    seek,
    sleepMinutes,
    armSleep,
    volume,
    setVolume,
  });

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
