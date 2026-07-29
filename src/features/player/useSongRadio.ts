import { useCallback } from 'react';
import { usePlayer } from './usePlayer';
import { getInstantMix } from '../../lib/jellyfinItems';
import { touchRecentPlay } from '../library/recentPlays';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Start a SONG radio: play the seed track immediately so the queue changes and
 * Now-Playing updates at once, then extend the queue with the song's InstantMix
 * as it arrives. InstantMix is slow (10-40s over the tunnel), so awaiting it
 * before playing anything made "Go to song radio" look broken — the toast fired
 * but nothing happened for ~12s. Seeding from the song first makes it instant;
 * the mix flows in behind it as true radio (mirrors useSeedRadio for albums).
 */
export function useSongRadio() {
  const { playQueue, addToQueue } = usePlayer();
  return useCallback(
    (track: JellyfinItem) => {
      touchRecentPlay(track.Id, Date.now());
      playQueue([track], 0);
      void getInstantMix(track.Id)
        .then((mix) => {
          // Drop the seed if the mix echoes it back, so it isn't queued twice.
          const rest = mix.filter((t) => t.Id !== track.Id);
          if (rest.length) addToQueue(rest);
        })
        .catch(() => undefined);
    },
    [playQueue, addToQueue],
  );
}
