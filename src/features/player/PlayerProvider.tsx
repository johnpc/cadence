import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { PlayerContext } from './PlayerContext';
import { useAudioElement } from './useAudioElement';
import { audioStreamUrl } from '../../lib/jellyfinStream';
import { random } from '../../lib/random';
import * as q from './queue';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Holds the play queue + the one audio element, exposing player controls. */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<q.QueueState>(q.EMPTY_QUEUE);
  const [shuffle, setShuffle] = useState(false);
  const queueRef = useRef(queue);
  queueRef.current = queue;

  const advance = useCallback(() => setQueue((cur) => q.next(cur)), []);
  const { ref, isPlaying, position, duration } = useAudioElement(advance);

  const current = q.currentTrack(queue);
  const currentId = current?.Id;

  // Load + play whenever the current track changes.
  useEffect(() => {
    const audio = ref.current;
    if (!audio || !currentId) return;
    audio.src = audioStreamUrl(currentId);
    void audio.play().catch(() => undefined);
  }, [currentId, ref]);

  const playQueue = useCallback(
    (tracks: JellyfinItem[], startIndex = 0) => setQueue(q.startQueue(tracks, startIndex)),
    [],
  );
  const toggle = useCallback(() => {
    const audio = ref.current;
    if (!audio || !queueRef.current.tracks.length) return;
    if (audio.paused) void audio.play().catch(() => undefined);
    else audio.pause();
  }, [ref]);
  const next = useCallback(() => setQueue((cur) => q.next(cur)), []);
  const prev = useCallback(() => setQueue((cur) => q.prev(cur)), []);
  const seek = useCallback(
    (seconds: number) => {
      if (ref.current) ref.current.currentTime = seconds;
    },
    [ref],
  );
  const toggleShuffle = useCallback(() => {
    setShuffle((on) => {
      if (!on) setQueue((cur) => q.shuffleRest(cur, random));
      return !on;
    });
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        current,
        isPlaying,
        position,
        duration,
        shuffle,
        canNext: q.hasNext(queue),
        canPrev: q.hasPrev(queue),
        playQueue,
        toggle,
        next,
        prev,
        seek,
        toggleShuffle,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
