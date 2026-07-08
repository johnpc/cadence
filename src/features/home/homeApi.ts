import { useQuery } from '@tanstack/react-query';
import { getAudioItems } from '../../lib/jellyfinItems';

/** Tracks shown on Home. For now a slice of the library; slice 7 replaces this
 * with recommendation shelves (recently added, suggestions, radio). */
export function useHomeTracks() {
  const query = useQuery({
    queryKey: ['home-tracks'],
    queryFn: () => getAudioItems(30),
    staleTime: 60_000,
  });
  return {
    tracks: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
