import { useQuery } from '@tanstack/react-query';
import {
  getAudiobooks,
  getResumableAudiobooks,
  getFavoriteAudiobooks,
} from './audiobookLibraryApi';
import { mergeHighlights } from './mergeHighlights';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The audiobook library + a "highlights" subset (in-progress + favorited books,
 * most-recent first) for the top section — each query independent so the page
 * renders progressively. */
export function useAudiobookLibrary(): {
  books: JellyfinItem[];
  highlights: JellyfinItem[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const all = useQuery({
    queryKey: ['audiobooks'],
    queryFn: () => getAudiobooks(),
    staleTime: 60_000,
  });
  const resumable = useQuery({
    queryKey: ['audiobooks-resumable'],
    queryFn: () => getResumableAudiobooks(),
    staleTime: 30_000,
  });
  const favorites = useQuery({
    queryKey: ['audiobooks-favorites'],
    queryFn: () => getFavoriteAudiobooks(),
    staleTime: 30_000,
  });
  return {
    books: all.data ?? [],
    // In-progress first, then favorites not already shown (deduped by id).
    highlights: mergeHighlights(resumable.data ?? [], favorites.data ?? []),
    isLoading: all.isLoading,
    isError: all.isError,
    refetch: () => void all.refetch(),
  };
}
