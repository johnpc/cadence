import { useMemo } from 'react';
import { buildPlayerValue } from './playerValue';
import type { usePlayerQueue } from './usePlayerQueue';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { SleepMode } from './useSleepTimer';
import type { PlayerContextValue } from './types';

type QueueHook = ReturnType<typeof usePlayerQueue>;

interface Transport {
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
}

/**
 * The memoized PlayerContext value. Excludes fast-changing position/duration
 * (those live in PlayerProgressContext) so it only changes on real state
 * transitions — memoizing it keeps a play/pause tick from re-rendering every
 * TrackRow in a list. Extracted from PlayerProvider to keep it under the gate.
 */
export function usePlayerValue(
  qh: QueueHook,
  current: JellyfinItem | null,
  t: Transport,
): PlayerContextValue {
  // Destructure so the memo depends on each transport field individually (a
  // fresh `t` object every render would otherwise defeat the memo, and the
  // exhaustive-deps lint can't see through the object).
  const {
    isPlaying,
    waiting,
    toggle,
    seek,
    sleepMode,
    armSleep,
    volume,
    setVolume,
    rate,
    setRate,
  } = t;
  return useMemo(
    () =>
      buildPlayerValue(qh, current, {
        isPlaying,
        waiting,
        toggle,
        seek,
        sleepMode,
        armSleep,
        volume,
        setVolume,
        rate,
        setRate,
      }),
    [
      qh,
      current,
      isPlaying,
      waiting,
      toggle,
      seek,
      sleepMode,
      armSleep,
      volume,
      setVolume,
      rate,
      setRate,
    ],
  );
}
