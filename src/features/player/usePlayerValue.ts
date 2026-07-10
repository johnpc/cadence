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
  return useMemo(
    () => buildPlayerValue(qh, current, t),
    // Spread the transport fields so the memo tracks each one individually.
    [
      qh,
      current,
      t.isPlaying,
      t.waiting,
      t.toggle,
      t.seek,
      t.sleepMode,
      t.armSleep,
      t.volume,
      t.setVolume,
      t.rate,
      t.setRate,
    ],
  );
}
