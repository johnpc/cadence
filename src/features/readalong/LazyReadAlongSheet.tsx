import { lazy, Suspense, useEffect, useState } from 'react';

const Sheet = lazy(() => import('./ReadAlongSheet').then((m) => ({ default: m.ReadAlongSheet })));

/**
 * The read-along sheet, loaded on first open. It is the one full-player
 * overlay most listeners never touch (it needs the Storyteller bridge), so its
 * code — the sanitizer, timeline math and sheet UI — stays out of the app
 * entry chunk (which has a 50 kB gzipped budget, see .size-limit.json) and is
 * fetched the first time a listener taps "Read along". The latch keeps the
 * sheet mounted after that first open so the dismiss animation still plays and
 * react-query keeps its book/chapter cache.
 */
export function LazyReadAlongSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [armed, setArmed] = useState(open);
  useEffect(() => {
    if (open) setArmed(true);
  }, [open]);
  if (!armed) return null;
  return (
    <Suspense fallback={null}>
      <Sheet open={open} onClose={onClose} />
    </Suspense>
  );
}
