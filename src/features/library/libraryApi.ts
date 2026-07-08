import { useQuery } from '@tanstack/react-query';
import { getFavoriteSongs, getFavoriteAlbums } from '../../lib/jellyfinItems';
import { getFavoriteArtists } from '../../lib/jellyfinArtists';

/** Query key for the liked-songs list (shared so the toggle can invalidate it). */
export const LIKED_SONGS_KEY = ['liked-songs'];
/** Query key for the saved-albums list. */
export const SAVED_ALBUMS_KEY = ['saved-albums'];
/** Query key for the followed-artists list. */
export const FOLLOWED_ARTISTS_KEY = ['followed-artists'];

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

/** The user's followed artists. */
export function useFollowedArtists() {
  const query = useQuery({
    queryKey: FOLLOWED_ARTISTS_KEY,
    queryFn: () => getFavoriteArtists(),
    staleTime: 30_000,
  });
  return {
    artists: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
