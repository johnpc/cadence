import * as q from './queue';
import { canAdvance, isPlayingState } from './engine/transitions';
import type { PlayerEngine, PlayerState } from './engine/types';
import type { PlayerContextValue } from './types';

/**
 * The PlayerContext value for one engine state. Pure, and only recomputed when
 * `PlayerState` changes — position ticks live in their own store, so a tick
 * never re-renders a TrackRow. Commands are the engine's own (stable) functions.
 */
export function playerContextValue(s: PlayerState, engine: PlayerEngine): PlayerContextValue {
  const current = q.currentTrack(s.queue);
  return {
    current,
    isPlaying: isPlayingState(s),
    waiting: s.status === 'buffering',
    shuffle: s.shuffle,
    repeat: s.repeat,
    canNext: canAdvance(s.queue, s.repeat),
    // Prev is enabled whenever a track is loaded: even on the first track it
    // usefully restarts the current one (smart-prev), matching Spotify.
    canPrev: !!current,
    queue: s.queue.tracks,
    queueIndex: s.queue.index,
    sleepMode: s.sleep,
    volume: s.volume,
    rate: s.rate,
    playQueue: engine.playQueue,
    playShuffled: engine.playShuffled,
    playNext: engine.playNext,
    addToQueue: engine.addToQueue,
    toggle: engine.toggle,
    next: engine.next,
    prev: engine.prev,
    jumpTo: engine.jumpTo,
    removeFromQueue: engine.removeFromQueue,
    moveInQueue: engine.moveInQueue,
    clearQueue: engine.clearQueue,
    stop: engine.stop,
    seek: engine.seek,
    toggleShuffle: engine.toggleShuffle,
    cycleRepeat: engine.cycleRepeat,
    armSleep: engine.armSleep,
    setVolume: engine.setVolume,
    setRate: engine.setRate,
  };
}
