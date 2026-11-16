import { useQuery } from '@tanstack/react-query';
import {
  getAudiobooks,
  getResumableAudiobooks,
  getFavoriteAudiobooks,
} from './audiobookLibraryApi';
import { mergeHighlights } from './mergeHighlights';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Just the "highlights" subset (in-progress + favorited books) — two small
 * BOUNDED queries, no full-library scan. Used by the widget sync, which only
 * needs the resume candidate: pulling in the 5000-item `getAudiobooks()` there
 * fired a 7–19s library scan on EVERY screen (the hook mounts app-wide), even
 * on web where there's no widget. `enabled` lets that caller skip it entirely.
 * The Audiobooks page shares the same query keys, so opening it is a cache hit. */
export function useAudiobookHighlights(enabled = true): JellyfinItem[] {
  const resumable = useQuery({
    queryKey: ['audiobooks-resumable'],
    queryFn: () => getResumableAudiobooks(),
    staleTime: 30_000,
    enabled,
  });
  const favorites = useQuery({
    queryKey: ['audiobooks-favorites'],
    queryFn: () => getFavoriteAudiobooks(),
    staleTime: 30_000,
    enabled,
  });
  return mergeHighlights(resumable.data ?? [], favorites.data ?? []);
}

/** The audiobook library + a "highlights" subset (in-progress + favorited books,
 * most-recent first) for the top section — each query independent so the page
 * renders progressively. The library is one native Jellyfin query (fast on
 * Jellyfin 12; a server plugin used to precompute it). */
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
  const highlights = useAudiobookHighlights();
  return {
    books: all.data ?? [],
    highlights,
    isLoading: all.isLoading,
    isError: all.isError,
    refetch: () => void all.refetch(),
  };
}
