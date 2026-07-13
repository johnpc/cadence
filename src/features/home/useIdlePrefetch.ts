import { useEffect } from 'react';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * During browser idle time after Home settles, warm the single most-likely first
 * navigation — the top shelf's first card — so even a FIRST-EVER open (which the
 * disk cache can't help, since the item was never opened) paints instantly.
 *
 * Deliberately just ONE item: each prefetch is a request over the slow Jellyfin
 * tunnel, so warming a whole shelf would stampede it and hurt the very load it's
 * meant to help. react-query dedupes + staleTime-guards, so if the user hovers or
 * taps that card first, this costs nothing. Uses requestIdleCallback so it never
 * competes with Home's own paint; falls back to a short timeout where that API is
 * absent (older Safari / jsdom).
 */
export function useIdlePrefetch(
  item: JellyfinItem | undefined,
  prefetch: (i: JellyfinItem) => void,
): void {
  useEffect(() => {
    if (!item) return;
    const ric = window.requestIdleCallback;
    if (ric) {
      const id = ric(() => prefetch(item));
      return () => window.cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => prefetch(item), 1500);
    return () => clearTimeout(t);
  }, [item, prefetch]);
}
