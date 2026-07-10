import { useQuery } from '@tanstack/react-query';
import { getLatestAlbums, getSuggestedSongs, getRecentlyPlayed } from '../../lib/jellyfinDiscover';
import { getPublicPlaylists } from '../../lib/jellyfinPlaylists';

/** Other users' public playlists, for a Home "From the community" shelf — the
 * playlists Your Library deliberately excludes (not owned by you). Tapping one
 * opens it read-only with a Clone action. */
export function usePublicPlaylists() {
  const q = useQuery({
    queryKey: ['home', 'public-playlists'],
    queryFn: () => getPublicPlaylists(20),
    staleTime: 5 * 60_000,
  });
  return {
    playlists: q.data ?? [],
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: q.refetch,
  };
}

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
