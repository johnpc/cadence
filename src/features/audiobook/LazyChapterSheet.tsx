import { lazy, Suspense, useEffect, useState } from 'react';

const Sheet = lazy(() => import('./ChapterSheet').then((m) => ({ default: m.ChapterSheet })));

/**
 * The chapter sheet, loaded on first open. It only appears when a listener taps
 * "Chapters", so its list UI stays out of the app entry chunk (50 kB
 * gzipped budget, see .size-limit.json). The latch keeps it mounted after the
 * first open so the dismiss animation still plays.
 */
export function LazyChapterSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
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
