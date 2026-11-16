import * as q from '../queue';
import { moveAt, clearUpcoming } from '../queueMove';
import { nextRepeat } from '../playerModes';
import type { JellyfinItem } from '../../../lib/jellyfinTypes';
import type { EngineCore } from './core';
import type { PlayerCommands } from './types';

type QueueCommands = Pick<
  PlayerCommands,
  | 'playQueue'
  | 'playShuffled'
  | 'playNext'
  | 'addToQueue'
  | 'next'
  | 'jumpTo'
  | 'removeFromQueue'
  | 'moveInQueue'
  | 'clearQueue'
  | 'toggleShuffle'
  | 'cycleRepeat'
>;

/** Queue + mode commands. Each is a pure queue transition (queue.ts et al.)
 * handed to `setQueue`, which keeps the element on the current track. */
export function queueCommands({ get, setQueue, setModes, deps }: EngineCore): QueueCommands {
  return {
    playQueue: (tracks: JellyfinItem[], startIndex = 0) =>
      setQueue(q.startQueue(tracks, startIndex)),
    playShuffled: (tracks) => {
      setModes({ shuffle: true });
      setQueue(q.startShuffled(tracks, deps.random));
    },
    playNext: (track) => setQueue(q.enqueueNext(get().queue, track)),
    addToQueue: (track) => {
      const items = Array.isArray(track) ? track : [track];
      if (!items.length) return;
      const c = get().queue;
      setQueue(c.tracks.length ? q.append(c, items) : q.startQueue(items, 0));
    },
    // Manual next wraps last → first only under repeat-all (Spotify-style).
    next: () => setQueue(q.next(get().queue, get().repeat === 'all')),
    jumpTo: (index) => {
      const c = get().queue;
      const clamped = Math.max(0, Math.min(index, c.tracks.length - 1));
      if (clamped !== c.index) setQueue({ ...c, index: clamped });
    },
    removeFromQueue: (at) => setQueue(q.removeAt(get().queue, at)),
    moveInQueue: (from, to) => setQueue(moveAt(get().queue, from, to)),
    clearQueue: () => setQueue(clearUpcoming(get().queue)),
    // ON shuffles what's upcoming (current stays first) and remembers the order;
    // OFF restores it rather than leaving the queue scrambled.
    toggleShuffle: () => {
      const s = get();
      setModes({ shuffle: !s.shuffle });
      setQueue(s.shuffle ? q.unshuffle(s.queue) : q.shuffleRest(s.queue, deps.random));
    },
    cycleRepeat: () => setModes({ repeat: nextRepeat(get().repeat) }),
  };
}
