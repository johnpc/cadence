import * as q from './queue';
import type { usePlayerQueue } from './usePlayerQueue';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { PlayerContextValue } from './types';

type QueueHook = ReturnType<typeof usePlayerQueue>;

/** Assemble the PlayerContext value from the queue hook + the audio-derived
 * transport bits. Pure mapping, kept out of the provider for the line gate. */
export function buildPlayerValue(
  qh: QueueHook,
  current: JellyfinItem | null,
  transport: {
    isPlaying: boolean;
    toggle: () => void;
    seek: (seconds: number) => void;
    sleepMinutes: number | null;
    armSleep: (minutes: number | null) => void;
    volume: number;
    setVolume: (volume: number) => void;
  },
): PlayerContextValue {
  return {
    current,
    isPlaying: transport.isPlaying,
    shuffle: qh.shuffle,
    repeat: qh.repeat,
    canNext: q.hasNext(qh.queue),
    canPrev: q.hasPrev(qh.queue),
    queue: qh.queue.tracks,
    queueIndex: qh.queue.index,
    playQueue: qh.playQueue,
    playShuffled: qh.playShuffled,
    playNext: qh.playNext,
    addToQueue: qh.addToQueue,
    toggle: transport.toggle,
    next: qh.next,
    prev: qh.prev,
    jumpTo: qh.jumpTo,
    removeFromQueue: qh.removeFromQueue,
    moveInQueue: qh.moveInQueue,
    clearQueue: qh.clearQueue,
    seek: transport.seek,
    toggleShuffle: qh.toggleShuffle,
    cycleRepeat: qh.cycleRepeat,
    sleepMinutes: transport.sleepMinutes,
    armSleep: transport.armSleep,
    volume: transport.volume,
    setVolume: transport.setVolume,
  };
}
