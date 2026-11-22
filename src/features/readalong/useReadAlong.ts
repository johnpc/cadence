import { useQuery } from '@tanstack/react-query';
import { getChapterText, getReadAlongBook } from './storytellerApi';

/** The plugin's read-along picture of the book the given part belongs to.
 * Fetched only while wanted (sheet open + feature on); the plugin caches the
 * heavy timeline server-side, so a long staleTime here just avoids refetch churn. */
export function useReadAlongBook(itemId: string | undefined, enabled: boolean) {
  const q = useQuery({
    queryKey: ['readalong-book', itemId],
    queryFn: () => getReadAlongBook(itemId as string),
    enabled: enabled && !!itemId,
    staleTime: 300_000,
  });
  return {
    book: q.data,
    isLoading: q.isLoading && enabled && !!itemId,
    isError: q.isError,
    refetch: q.refetch,
  };
}

/** One chapter's raw XHTML (sanitized by the caller). Keyed by book item + href;
 * chapter text never changes once aligned, so it can stay fresh for the session. */
export function useChapterText(itemId: string | undefined, href: string | null) {
  const q = useQuery({
    queryKey: ['readalong-chapter', itemId, href],
    queryFn: () => getChapterText(itemId as string, href as string),
    enabled: !!itemId && !!href,
    staleTime: Infinity,
  });
  return { html: q.data, isLoading: q.isLoading && !!href, isError: q.isError, refetch: q.refetch };
}
