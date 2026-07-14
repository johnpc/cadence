import { useCallback } from 'react';
import { usePlayer } from './usePlayer';
import { getInstantMix, getItemTracks } from '../../lib/jellyfinItems';

/** Start an album radio: play the album's OWN tracks immediately (fast — they're
 * disk-cached, so playback + the Now-Playing bar start at once), then extend the
 * queue with the album's instant-mix in the background. InstantMix is slow
 * (10-40s over the tunnel), so awaiting it before playing anything made radio
 * feel broken (nothing happened for tens of seconds); seeding from the album's
 * tracks first makes it instant, and the mix flows in behind it as true radio.
 * Falls back to just the mix if the album has no tracks. */
export function useSeedRadio() {
  const { playQueue, addToQueue } = usePlayer();
  return useCallback(
    async (seedId: string) => {
      const tracks = await getItemTracks(seedId).catch(() => []);
      if (tracks.length) {
        playQueue(tracks, 0);
        // Extend with the radio mix behind the now-playing album tracks.
        void getInstantMix(seedId)
          .then((mix) => {
            if (mix.length) addToQueue(mix);
          })
          .catch(() => undefined);
        return;
      }
      const mix = await getInstantMix(seedId);
      if (mix.length) playQueue(mix, 0);
    },
    [playQueue, addToQueue],
  );
}
