import { useCallback } from 'react';
import { usePlayer } from './usePlayer';
import { getInstantMix } from '../../lib/jellyfinItems';

/** Start an instant-mix radio seeded on any item id — unlike usePlayItem, this
 * always fetches the mix (an album's *radio*, not its own tracklist). */
export function useSeedRadio() {
  const { playQueue } = usePlayer();
  return useCallback(
    async (seedId: string) => {
      const mix = await getInstantMix(seedId);
      if (mix.length) playQueue(mix, 0);
    },
    [playQueue],
  );
}
