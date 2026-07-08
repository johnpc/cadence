import { useQuery } from '@tanstack/react-query';
import { getGenreTracks } from '../../lib/jellyfinGenres';

/** The tracks for a genre page, most-played first. */
export function useGenreTracks(genre: string) {
  const q = useQuery({
    queryKey: ['genre-tracks', genre],
    queryFn: () => getGenreTracks(genre),
    staleTime: 5 * 60_000,
  });
  return { tracks: q.data ?? [], isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}
