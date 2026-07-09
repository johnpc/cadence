import { useCallback, useEffect, useRef, useState } from 'react';

/** Progressive rendering for long lists: start with `initial` rows and grow by
 * `step` whenever a sentinel near the list's end scrolls into view. Keeps the
 * first paint cheap for big playlists (e.g. 463 tracks) without a windowing lib
 * or fixed row heights. `count` resets the window when the list changes (e.g. a
 * new filter). Returns the visible count + a ref to attach to the sentinel. */
export function useProgressiveList(count: number, initial = 50, step = 50) {
  const [limit, setLimit] = useState(initial);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset when the underlying list size changes (filter applied, playlist swapped).
  useEffect(() => {
    setLimit(initial);
  }, [count, initial]);

  const grow = useCallback(() => setLimit((l) => Math.min(l + step, count)), [step, count]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || limit >= count) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) grow();
      },
      { rootMargin: '400px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [grow, limit, count]);

  return { limit: Math.min(limit, count), sentinelRef, hasMore: limit < count };
}
