import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { PlayerContext } from './PlayerContext';
import { useAudioElement } from './useAudioElement';
import { useMediaSessionSync } from './useMediaSessionSync';
import { usePlayerQueue } from './usePlayerQueue';
import { useSleepTimer } from './useSleepTimer';
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

  // Load + play whenever the current track changes.
  useEffect(() => {
    const audio = ref.current;
    if (!audio || !currentId) return;
    audio.src = audioStreamUrl(currentId);
    void audio.play().catch(() => undefined);
  }, [currentId, ref]);

  const toggle = useCallback(() => {
    const audio = ref.current;
    if (!audio || !qh.queue.tracks.length) return;
    if (audio.paused) void audio.play().catch(() => undefined);
    else audio.pause();
  }, [ref, qh.queue.tracks.length]);
  const seek = useCallback(
    (seconds: number) => {
      if (ref.current) ref.current.currentTime = seconds;
    },
    [ref],
  );

  // Sleep timer: pause when it elapses.
  const pause = useCallback(() => ref.current?.pause(), [ref]);
  const { sleepMinutes, armSleep } = useSleepTimer(pause);

  const mediaHandlers = useMemo(
    () => ({ play: toggle, pause: toggle, next: qh.next, prev: qh.prev }),
    [toggle, qh.next, qh.prev],
  );
  useMediaSessionSync(current, isPlaying, mediaHandlers);

  return (
    <PlayerContext.Provider
      value={{
        current,
        isPlaying,
        position,
        duration,
        shuffle: qh.shuffle,
        repeat: qh.repeat,
        canNext: q.hasNext(qh.queue),
        canPrev: q.hasPrev(qh.queue),
        queue: qh.queue.tracks,
        queueIndex: qh.queue.index,
        playQueue: qh.playQueue,
        playShuffled: qh.playShuffled,
        playNext: qh.playNext,
        toggle,
        next: qh.next,
        prev: qh.prev,
        jumpTo: qh.jumpTo,
        seek,
        toggleShuffle: qh.toggleShuffle,
        cycleRepeat: qh.cycleRepeat,
        sleepMinutes,
        armSleep,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
