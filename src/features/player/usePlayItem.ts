import { useCallback } from 'react';
import { usePlayer } from './usePlayer';
import { getInstantMix, getItemTracks } from '../../lib/jellyfinItems';
import { getPlaylistItems } from '../../lib/jellyfinPlaylists';
import { touchRecentPlay } from '../library/recentPlays';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Load the ordered tracks a collection should play: an album's tracks, a
 * playlist's tracks, else an instant-mix radio (artist/song seed). */
async function tracksFor(item: JellyfinItem): Promise<JellyfinItem[]> {
  if (item.Type === 'MusicAlbum') return getItemTracks(item.Id);
  if (item.Type === 'Playlist') return getPlaylistItems(item.Id);
  return getInstantMix(item.Id);
}

/**
 * Play a non-track item: an album/playlist plays its tracks in order; anything
 * else (an artist) starts an instant-mix radio. Falls back to a radio if a
 * collection somehow has no tracks. Records a recent play so the item bubbles up
 * Your Library's default order.
 */
export function usePlayItem() {
  const { playQueue } = usePlayer();
  return useCallback(
    async (item: JellyfinItem) => {
      const tracks = await tracksFor(item);
      const queue = tracks.length ? tracks : await getInstantMix(item.Id);
      if (queue.length) {
        touchRecentPlay(item.Id, Date.now());
        playQueue(queue, 0);
      }
    },
    [playQueue],
  );
}
