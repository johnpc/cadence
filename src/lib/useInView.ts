import { useEffect, useRef, useState } from 'react';

/** Observe a sentinel element and flip to `true` once it scrolls near the
 * viewport (stays true after — a one-way latch). Lets a page defer an expensive
 * below-the-fold query until the user is about to see its section, instead of
 * firing it on mount and contending with the initial paint. `rootMargin` starts
 * the fetch a bit before the section is actually visible. */
export function useInView(rootMargin = '200px'): {
  ref: (el: Element | null) => void;
  inView: boolean;
} {
  const [inView, setInView] = useState(false);
  const seen = useRef(false);
  const [node, setNode] = useState<Element | null>(null);

  useEffect(() => {
    if (!node || seen.current) return;
    if (typeof IntersectionObserver === 'undefined') {
      // No IO (older/jsdom) — don't gate content out; show it.
      seen.current = true;
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          seen.current = true;
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [node, rootMargin]);

  return { ref: setNode, inView };
}
