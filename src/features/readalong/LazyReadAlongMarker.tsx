import { lazy, Suspense } from 'react';
import { useStorytellerEnabled } from './useStorytellerEnabled';

const Marker = lazy(() =>
  import('./ReadAlongMarker').then((m) => ({ default: m.ReadAlongMarker })),
);

/**
 * The read-along badge for a book row or header, loaded on demand. Book rows
 * live in the app entry chunk (Downloads, the offline library), which has a
 * 50 kB gzipped budget (.size-limit.json); the list query, its index and the
 * badge only matter on servers with a Storyteller bridge, so they load on
 * first use and render nothing at all elsewhere. The badge sits at the end of
 * the meta line, so its late arrival never moves anything.
 */
export function LazyReadAlongMarker({ book }: { book: { id: string; parts: { Id: string }[] } }) {
  if (!useStorytellerEnabled()) return null;
  return (
    <Suspense fallback={null}>
      <Marker book={book} />
    </Suspense>
  );
}
