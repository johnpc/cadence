import { useQuery } from '@tanstack/react-query';
import { getAudiobooks, getResumableAudiobooks } from './audiobookLibraryApi';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The audiobook library + the "Continue listening" (resumable) subset, each as
 * its own query so the page can render one while the other loads. */
export function useAudiobookLibrary(): {
  books: JellyfinItem[];
  resumable: JellyfinItem[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const all = useQuery({
    queryKey: ['audiobooks'],
    queryFn: () => getAudiobooks(),
    staleTime: 60_000,
  });
  const cont = useQuery({
    queryKey: ['audiobooks-resumable'],
    queryFn: () => getResumableAudiobooks(),
    staleTime: 30_000,
  });
  return {
    books: all.data ?? [],
    resumable: cont.data ?? [],
    isLoading: all.isLoading,
    isError: all.isError,
    refetch: () => void all.refetch(),
  };
}
