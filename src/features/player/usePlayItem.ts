import { useCallback } from 'react';
import { usePlayer } from './usePlayer';
import { getInstantMix, getItemTracks } from '../../lib/jellyfinItems';
import { touchRecentPlay } from '../library/recentPlays';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Play a non-track item: an album plays its tracks in order; anything else
 * (an artist) starts an instant-mix radio. Falls back to a radio if an album
 * somehow has no tracks. Records a recent play so the item bubbles up Your
 * Library's default order.
 */
export function usePlayItem() {
  const { playQueue } = usePlayer();
  return useCallback(
    async (item: JellyfinItem) => {
      const tracks =
        item.Type === 'MusicAlbum' ? await getItemTracks(item.Id) : await getInstantMix(item.Id);
      const queue = tracks.length ? tracks : await getInstantMix(item.Id);
      if (queue.length) {
        touchRecentPlay(item.Id, Date.now());
        playQueue(queue, 0);
      }
    },
    [playQueue],
  );
}
