import { useMemo } from 'react';
import { useCast } from './useCast';
import { useCastProgress } from './useCastProgress';
import type { PositionPhase } from '../player/engine/types';
import type { PlayerProgress } from '../player/PlayerProgressContext';

/** The progress the scrubber should show: the RECEIVER's position while casting
 * (the local audio is paused then), else the local element's. Memoized so the
 * player's progress context only changes on an actual tick. */
export function useEffectiveProgress(
  position: number,
  duration: number,
  phase: PositionPhase = 'known',
): PlayerProgress {
  const { connected } = useCast();
  const castProgress = useCastProgress();
  return useMemo(
    // The receiver reports a real position; only the local element waits on a resume.
    () =>
      connected ? { ...castProgress, phase: 'known' as const } : { position, duration, phase },
    [connected, castProgress, position, duration, phase],
  );
}
