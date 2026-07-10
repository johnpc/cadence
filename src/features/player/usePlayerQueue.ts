import { useCallback, useEffect, useRef, useState } from 'react';
import * as q from './queue';
import { moveAt, clearUpcoming } from './queueMove';
import { loadQueue, saveQueue } from './queuePersistence';
import { loadModes, saveModes, nextRepeat } from './playerModes';
import { random } from '../../lib/random';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { RepeatMode } from './types';

/**
 * Owns the play queue, shuffle, and repeat — all the pure-state orchestration —
 * so PlayerProvider only wires it to the audio element. `advance` applies the
 * repeat rule when a track ends (loop the queue on 'all', replay on 'one').
 * The queue is persisted so playback survives a reload (restored paused).
 */
export function usePlayerQueue() {
  const [queue, setQueue] = useState<q.QueueState>(loadQueue);
  const [shuffle, setShuffle] = useState(() => loadModes().shuffle);
  const [repeat, setRepeat] = useState<RepeatMode>(() => loadModes().repeat);
  const repeatRef = useRef(repeat);
  repeatRef.current = repeat;

  // Persist so playback (queue) + shuffle/repeat survive a reload.
  useEffect(() => saveQueue(queue), [queue]);
  useEffect(() => saveModes({ shuffle, repeat }), [shuffle, repeat]);

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
  // Manual next/prev wrap around the ends when repeat-all is on (Spotify-style).
  const next = useCallback(() => setQueue((c) => q.next(c, repeatRef.current === 'all')), []);
  const prev = useCallback(() => setQueue((c) => q.prev(c, repeatRef.current === 'all')), []);
  const removeFromQueue = useCallback((at: number) => setQueue((c) => q.removeAt(c, at)), []);
  const moveInQueue = useCallback(
    (from: number, to: number) => setQueue((c) => moveAt(c, from, to)),
    [],
  );
  const jumpTo = useCallback((index: number) => setQueue((c) => ({ ...c, index })), []);
  const clearQueue = useCallback(() => setQueue((c) => clearUpcoming(c)), []);
  const cycleRepeat = useCallback(() => setRepeat(nextRepeat), []);
  const toggleShuffle = useCallback(() => {
    setShuffle((on) => {
      // Turning ON: shuffle the upcoming tracks (keeping current first) and
      // remember the prior order. Turning OFF: restore that order (Spotify-style)
      // rather than leaving the queue scrambled.
      setQueue((c) => (on ? q.unshuffle(c) : q.shuffleRest(c, random)));
      return !on;
    });
  }, []);

  /** Called when a track ends: 'one' replays in place; otherwise advance, with
   * 'all' wrapping past the end (same wrap as manual next). */
  const advance = useCallback(
    (replaySame: () => void) =>
      setQueue((c) => {
        if (repeatRef.current === 'one') {
          replaySame();
          return c;
        }
        return q.next(c, repeatRef.current === 'all');
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
