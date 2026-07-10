import type { SleepMode } from './useSleepTimer';

/** A short human label for an armed sleep timer, or null when it's off. Used by
 * the player's sleep indicator. Minute modes read as "Sleep in N min"; the
 * end-of-track mode reads as "Sleep after this track". */
export function sleepLabel(mode: SleepMode): string | null {
  if (mode === null) return null;
  if (mode === 'track') return 'Sleep after this track';
  return `Sleep in ${mode} min`;
}
