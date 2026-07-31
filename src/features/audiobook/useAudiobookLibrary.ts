import { useQuery } from '@tanstack/react-query';
import {
  getAudiobooks,
  getResumableAudiobooks,
  getFavoriteAudiobooks,
} from './audiobookLibraryApi';
import { mergeHighlights } from './mergeHighlights';
import { overlayProgress } from './overlayProgress';
import { useAudiobookSource } from './useAudiobookSource';
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
 * renders progressively.
 *
 * Prefers the plugin's precomputed library (one fast call) over the slow native
 * recursive scan, falling back to the scan when the plugin is absent or errors
 * (incl. its 503 cold miss). The plugin caches only the STATIC catalog, so live
 * reading progress from the (bounded, native) highlights query is overlaid onto
 * it — a cached UserData never makes a progress bar look stale. */
export function useAudiobookLibrary(): {
  books: JellyfinItem[];
  highlights: JellyfinItem[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const src = useAudiobookSource();
  // Native scan runs ONLY when the plugin path isn't owning the library (absent /
  // flag off) or errored — so exactly one library source is in flight.
  const nativeOn = !src.active || src.isError;
  const all = useQuery({
    queryKey: ['audiobooks'],
    queryFn: () => getAudiobooks(),
    enabled: nativeOn,
    staleTime: 60_000,
  });
  // In-progress first, then favorites not already shown (deduped by id).
  const highlights = useAudiobookHighlights();
  const cached = src.data;
  const books = cached ? overlayProgress(cached, highlights) : (all.data ?? []);
  return {
    books,
    highlights,
    isLoading: cached ? false : src.isLoading || (nativeOn && all.isLoading),
    isError: nativeOn && all.isError,
    refetch: () => (cached ? src.refetch() : void all.refetch()),
  };
}
