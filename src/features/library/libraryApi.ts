import { useQuery } from '@tanstack/react-query';
import { getFavoriteSongs, getFavoriteAlbums } from '../../lib/jellyfinItems';

/** Query key for the liked-songs list (shared so the toggle can invalidate it). */
export const LIKED_SONGS_KEY = ['liked-songs'];
/** Query key for the saved-albums list. */
export const SAVED_ALBUMS_KEY = ['saved-albums'];

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

/** The user's saved albums. */
export function useSavedAlbums() {
  const query = useQuery({
    queryKey: SAVED_ALBUMS_KEY,
    queryFn: () => getFavoriteAlbums(),
    staleTime: 30_000,
  });
  return {
    albums: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
