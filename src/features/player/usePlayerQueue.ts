import { useCallback, useRef, useState } from 'react';
import * as q from './queue';
import { random } from '../../lib/random';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { RepeatMode } from './types';

const NEXT_REPEAT: Record<RepeatMode, RepeatMode> = { off: 'all', all: 'one', one: 'off' };

/**
 * Owns the play queue, shuffle, and repeat — all the pure-state orchestration —
 * so PlayerProvider only wires it to the audio element. `advance` applies the
 * repeat rule when a track ends (loop the queue on 'all', replay on 'one').
 */
export function usePlayerQueue() {
  const [queue, setQueue] = useState<q.QueueState>(q.EMPTY_QUEUE);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const repeatRef = useRef(repeat);
  repeatRef.current = repeat;

  const playQueue = useCallback(
    (tracks: JellyfinItem[], startIndex = 0) => setQueue(q.startQueue(tracks, startIndex)),
    [],
  );
  const playNext = useCallback(
    (track: JellyfinItem) => setQueue((c) => q.enqueueNext(c, track)),
    [],
  );
  const playShuffled = useCallback((tracks: JellyfinItem[]) => {
    setQueue(q.startShuffled(tracks, random));
    setShuffle(true);
  }, []);
  const next = useCallback(() => setQueue((c) => q.next(c)), []);
  const prev = useCallback(() => setQueue((c) => q.prev(c)), []);
  const jumpTo = useCallback((index: number) => setQueue((c) => ({ ...c, index })), []);
  const cycleRepeat = useCallback(() => setRepeat((r) => NEXT_REPEAT[r]), []);
  const toggleShuffle = useCallback(() => {
    setShuffle((on) => {
      if (!on) setQueue((c) => q.shuffleRest(c, random));
      return !on;
    });
  }, []);

  /** Called when a track ends: 'one' replays, 'all' loops past the end, else next. */
  const advance = useCallback(
    (replaySame: () => void) =>
      setQueue((c) => {
        if (repeatRef.current === 'one') {
          replaySame();
          return c;
        }
        if (q.hasNext(c)) return q.next(c);
        return repeatRef.current === 'all' ? { ...c, index: 0 } : c;
      }),
    [],
  );

  return {
    queue,
    setQueue,
    shuffle,
    repeat,
    playQueue,
    playShuffled,
    playNext,
    next,
    prev,
    jumpTo,
    cycleRepeat,
    toggleShuffle,
    advance,
  };
}
