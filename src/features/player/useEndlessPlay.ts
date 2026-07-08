import { useEffect, useRef } from 'react';
import { getInstantMix } from '../../lib/jellyfinItems';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Spotify-style endless play: when the queue reaches its last track (and the
 * user isn't repeating), fetch an instant-mix radio seeded from that track and
 * append it, so music never just stops. Guards against re-fetching for the same
 * tail track. Disabled while repeat is on (the queue loops instead).
 */
export function useEndlessPlay(
  queue: JellyfinItem[],
  index: number,
  repeatOff: boolean,
  append: (tracks: JellyfinItem[]) => void,
) {
  const seededFor = useRef<string | null>(null);

  useEffect(() => {
    const last = queue[queue.length - 1];
    const atEnd = queue.length > 0 && index >= queue.length - 1;
    if (!atEnd || !repeatOff || !last || seededFor.current === last.Id) return;
    seededFor.current = last.Id;
    let cancelled = false;
    void getInstantMix(last.Id)
      .then((mix) => {
        // Drop the seed itself if Jellyfin echoes it back as the first result.
        const fresh = mix.filter((t) => t.Id !== last.Id);
        if (!cancelled && fresh.length) append(fresh);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [queue, index, repeatOff, append]);
}
