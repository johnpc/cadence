import { useCallback, useEffect, useRef, useState } from 'react';
import * as q from './queue';
import { moveAt, clearUpcoming } from './queueMove';
import { loadQueue, saveQueue } from './queuePersistence';
import { random } from '../../lib/random';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { RepeatMode } from './types';

const NEXT_REPEAT: Record<RepeatMode, RepeatMode> = { off: 'all', all: 'one', one: 'off' };

/**
 * Owns the play queue, shuffle, and repeat — all the pure-state orchestration —
 * so PlayerProvider only wires it to the audio element. `advance` applies the
 * repeat rule when a track ends (loop the queue on 'all', replay on 'one').
 * The queue is persisted so playback survives a reload (restored paused).
 */
export function usePlayerQueue() {
  const [queue, setQueue] = useState<q.QueueState>(loadQueue);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const repeatRef = useRef(repeat);
  repeatRef.current = repeat;

  useEffect(() => {
    saveQueue(queue);
  }, [queue]);

  const playQueue = useCallback(
    (tracks: JellyfinItem[], startIndex = 0) => setQueue(q.startQueue(tracks, startIndex)),
    [],
  );
  const playNext = useCallback(
    (track: JellyfinItem) => setQueue((c) => q.enqueueNext(c, track)),
    [],
  );
  const addToQueue = useCallback((track: JellyfinItem | JellyfinItem[]) => {
    const items = Array.isArray(track) ? track : [track];
    if (!items.length) return;
    setQueue((c) => (c.tracks.length ? q.append(c, items) : q.startQueue(items, 0)));
  }, []);
  const playShuffled = useCallback((tracks: JellyfinItem[]) => {
    setQueue(q.startShuffled(tracks, random));
    setShuffle(true);
  }, []);
  const next = useCallback(() => setQueue((c) => q.next(c)), []);
  const prev = useCallback(() => setQueue((c) => q.prev(c)), []);
  const removeFromQueue = useCallback((at: number) => setQueue((c) => q.removeAt(c, at)), []);
  const moveInQueue = useCallback(
    (from: number, to: number) => setQueue((c) => moveAt(c, from, to)),
    [],
  );
  const jumpTo = useCallback((index: number) => setQueue((c) => ({ ...c, index })), []);
  const clearQueue = useCallback(() => setQueue((c) => clearUpcoming(c)), []);
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
    addToQueue,
    next,
    prev,
    jumpTo,
    removeFromQueue,
    moveInQueue,
    clearQueue,
    cycleRepeat,
    toggleShuffle,
    advance,
  };
}
