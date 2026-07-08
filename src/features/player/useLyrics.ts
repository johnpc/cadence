import { useQuery } from '@tanstack/react-query';
import { getLyrics } from '../../lib/jellyfinLyrics';

/** Lyrics for a track, fetched lazily (only when the lyrics sheet is opened). */
export function useLyrics(itemId: string | undefined, enabled: boolean) {
  const q = useQuery({
    queryKey: ['lyrics', itemId],
    queryFn: () => getLyrics(itemId as string),
    enabled: enabled && !!itemId,
    staleTime: 300_000,
  });
  return {
    lines: q.data ?? [],
    isLoading: q.isLoading && enabled && !!itemId,
    isError: q.isError,
    refetch: q.refetch,
  };
}
