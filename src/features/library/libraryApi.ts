import { useQuery } from '@tanstack/react-query';
import { getFavoriteSongs } from '../../lib/jellyfinItems';

/** Query key for the liked-songs list (shared so the toggle can invalidate it). */
export const LIKED_SONGS_KEY = ['liked-songs'];

/** The user's liked songs. */
export function useLikedSongs() {
  const query = useQuery({
    queryKey: LIKED_SONGS_KEY,
    queryFn: () => getFavoriteSongs(),
    staleTime: 30_000,
  });
  return {
    songs: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
