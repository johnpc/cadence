import { lazy, Suspense } from 'react';

const Scrubbers = lazy(() =>
  import('./AudiobookScrubbers').then((m) => ({ default: m.AudiobookScrubbers })),
);

/**
 * The audiobook chapter + book bars, loaded with the first audiobook the player
 * shows. Music listeners never need them, and the app entry chunk has a 50 kB
 * gzipped budget (.size-limit.json). The fallback reserves the bars' height so
 * the player doesn't jump when they arrive.
 */
export function LazyAudiobookScrubbers() {
  return (
    <Suspense fallback={<div className="fullplayer__scrubber-placeholder" aria-hidden="true" />}>
      <Scrubbers />
    </Suspense>
  );
}
