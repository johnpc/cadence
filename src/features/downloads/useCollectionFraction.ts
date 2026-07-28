import { useSyncExternalStore } from 'react';
import { getProgress, onProgressChange } from './downloadProgress';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * A collection's overall download fraction (0..1): each already-saved track
 * counts as a full 1, and any track currently downloading contributes its live
 * partial fraction. Gives the collection button a smooth, byte-aware bar instead
 * of whole-track steps. `have` (the count already in the index) is passed in so
 * this stays in sync with the caller's own index subscription.
 */
export function useCollectionFraction(tracks: JellyfinItem[], have: number): number {
  const inFlight = useSyncExternalStore(
    onProgressChange,
    () => tracks.reduce((sum, t) => sum + (getProgress(t.Id) ?? 0), 0),
    () => 0,
  );
  const total = tracks.length;
  if (total === 0) return 0;
  // `have` may already include a track that's mid-write; cap at total so the
  // bar can't exceed 100%.
  return Math.min(1, (have + inFlight) / total);
}
