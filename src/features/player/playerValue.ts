import * as q from './queue';
import type { usePlayerQueue } from './usePlayerQueue';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { PlayerContextValue } from './types';
import type { SleepMode } from './useSleepTimer';

type QueueHook = ReturnType<typeof usePlayerQueue>;

/** Assemble the PlayerContext value from the queue hook + the audio-derived
 * transport bits. Pure mapping, kept out of the provider for the line gate. */
export function buildPlayerValue(
  qh: QueueHook,
  current: JellyfinItem | null,
  transport: {
    isPlaying: boolean;
    waiting: boolean;
    toggle: () => void;
    seek: (seconds: number) => void;
    sleepMode: SleepMode;
    armSleep: (mode: SleepMode) => void;
    volume: number;
    setVolume: (volume: number) => void;
    rate: number;
    setRate: (rate: number) => void;
  },
): PlayerContextValue {
  return {
    current,
    isPlaying: transport.isPlaying,
    waiting: transport.waiting,
    shuffle: qh.shuffle,
    repeat: qh.repeat,
    // With repeat-all, next wraps around the end, so it stays enabled on the
    // last track (as long as there's more than one track).
    canNext: q.hasNext(qh.queue) || (qh.repeat === 'all' && qh.queue.tracks.length > 1),
    // Prev is enabled whenever a track is loaded: even on the first track it
    // usefully restarts the current one (smart-prev), matching Spotify.
    canPrev: !!current,
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
    sleepMode: transport.sleepMode,
    armSleep: transport.armSleep,
    volume: transport.volume,
    setVolume: transport.setVolume,
    rate: transport.rate,
    setRate: transport.setRate,
  };
}
