import { useQuery } from '@tanstack/react-query';
import { getLatestAlbums, getSuggestedSongs, getRecentlyPlayed } from '../../lib/jellyfinDiscover';

/** Recently-added albums shelf. */
export function useLatestAlbums() {
  const q = useQuery({
    queryKey: ['home', 'latest-albums'],
    queryFn: () => getLatestAlbums(20),
    staleTime: 60_000,
  });
  return { albums: q.data ?? [], isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}

/** Suggested-for-you songs shelf. */
export function useSuggestedSongs() {
  const q = useQuery({
    queryKey: ['home', 'suggested'],
    queryFn: () => getSuggestedSongs(20),
    staleTime: 60_000,
  });
  return { songs: q.data ?? [], isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}

/** Recently-played songs. `limit` lets the full history page ask for more than
 * the Home shelf's 20. */
export function useRecentlyPlayed(limit = 20) {
  const q = useQuery({
    queryKey: ['home', 'recently-played', limit],
    queryFn: () => getRecentlyPlayed(limit),
    staleTime: 30_000,
  });
  return { songs: q.data ?? [], isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}
