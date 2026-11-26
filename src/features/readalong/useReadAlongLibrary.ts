import { useQuery } from '@tanstack/react-query';
import { useStorytellerEnabled } from './useStorytellerEnabled';
import { getReadAlongLibrary } from './storytellerApi';
import { EMPTY_INDEX, indexLibrary, statusOf, type ReadAlongIndex } from './readAlongLibrary';

/** Which audiobooks can be read along, for badges and the Books filter. One
 * shared query (every row observes the same cache entry); fetched only when
 * the server has a Storyteller bridge. The plugin caches its answer for a
 * minute, so refetching on focus picks up a finished alignment cheaply. */
export function useReadAlongLibrary(): ReadAlongIndex {
  const enabled = useStorytellerEnabled();
  const q = useQuery({
    queryKey: ['readalong-library'],
    queryFn: getReadAlongLibrary,
    enabled,
    staleTime: 300_000,
    refetchOnWindowFocus: true,
    select: indexLibrary,
  });
  return q.data ?? EMPTY_INDEX;
}

/** One book's read-along status (undefined while unknown). */
export function useReadAlongStatus(book: { id: string; parts: { Id: string }[] }) {
  return statusOf(useReadAlongLibrary(), book);
}
