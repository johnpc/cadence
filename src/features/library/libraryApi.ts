import { useQuery } from '@tanstack/react-query';
import { getFavoriteSongs, getFavoriteAlbums } from '../../lib/jellyfinItems';
import { getFavoriteArtists } from '../../lib/jellyfinArtists';
import { getCachedList, fetchAndCacheList } from './libraryListCache';

/** Query key for the liked-songs list (shared so the toggle can invalidate it). */
export const LIKED_SONGS_KEY = ['liked-songs'];
/** Query key for the saved-albums list. */
export const SAVED_ALBUMS_KEY = ['saved-albums'];
/** Query key for the followed-artists list. */
export const FOLLOWED_ARTISTS_KEY = ['followed-artists'];

/** initialData that seeds a library list from its disk cache so the tab paints
 * INSTANTLY on return, then refetches. `updatedAt: 0` marks the seed stale so
 * the background refresh always fires (and re-persists the fresh list). */
function seeded(kind: string) {
  const cached = getCachedList(kind);
  return { initialData: cached, initialDataUpdatedAt: cached ? 0 : undefined };
}

/** The user's liked songs. */
export function useLikedSongs() {
  const query = useQuery({
    queryKey: LIKED_SONGS_KEY,
    queryFn: () => fetchAndCacheList('liked-songs', getFavoriteSongs),
    staleTime: 30_000,
    ...seeded('liked-songs'),
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
    queryFn: () => fetchAndCacheList('saved-albums', getFavoriteAlbums),
    staleTime: 30_000,
    ...seeded('saved-albums'),
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
    queryFn: () => fetchAndCacheList('followed-artists', getFavoriteArtists),
    staleTime: 30_000,
    ...seeded('followed-artists'),
  });
  return {
    artists: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
