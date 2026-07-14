import { useQuery } from '@tanstack/react-query';
import {
  getLatestAlbums,
  getSuggestedSongs,
  getRecentlyPlayed,
  getOnRepeat,
} from '../../lib/jellyfinDiscover';
import { getPublicPlaylists } from '../../lib/jellyfinPlaylists';
import { getCachedShelf, fetchAndCacheShelf } from './homeShelfCache';

/** initialData that seeds a shelf query from its disk cache so a returning user
 * sees Home INSTANTLY, then react-query refetches. `updatedAt: 0` marks the
 * seed as stale so the background refresh always fires. */
function seeded(shelf: string) {
  const cached = getCachedShelf(shelf);
  return { initialData: cached, initialDataUpdatedAt: cached ? 0 : undefined };
}

/** Other users' public playlists, for a Home "From the community" shelf — the
 * playlists Your Library deliberately excludes (not owned by you). Tapping one
 * opens it read-only with a Clone action. */
export function usePublicPlaylists() {
  const q = useQuery({
    queryKey: ['home', 'public-playlists'],
    queryFn: () => fetchAndCacheShelf('public-playlists', () => getPublicPlaylists(20)),
    staleTime: 5 * 60_000,
    ...seeded('public-playlists'),
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
    queryFn: () => fetchAndCacheShelf('latest-albums', () => getLatestAlbums(20)),
    staleTime: 60_000,
    ...seeded('latest-albums'),
  });
  return { albums: q.data ?? [], isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}

/** Suggested-for-you songs shelf. */
export function useSuggestedSongs() {
  const q = useQuery({
    queryKey: ['home', 'suggested'],
    queryFn: () => fetchAndCacheShelf('suggested', () => getSuggestedSongs(20)),
    staleTime: 60_000,
    ...seeded('suggested'),
  });
  return { songs: q.data ?? [], isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}

/** Recently-played songs. `limit` lets the full history page ask for more than
 * the Home shelf's 20. Only the default (20) shelf seeds from disk. */
export function useRecentlyPlayed(limit = 20) {
  const q = useQuery({
    queryKey: ['home', 'recently-played', limit],
    queryFn: () =>
      limit === 20
        ? fetchAndCacheShelf('recently-played', () => getRecentlyPlayed(limit))
        : getRecentlyPlayed(limit),
    staleTime: 30_000,
    ...(limit === 20 ? seeded('recently-played') : {}),
  });
  return { songs: q.data ?? [], isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}

/** Your most-played tracks ("On repeat" shelf). Seeded from disk like the others. */
export function useOnRepeat() {
  const q = useQuery({
    queryKey: ['home', 'on-repeat'],
    queryFn: () => fetchAndCacheShelf('on-repeat', () => getOnRepeat(20)),
    staleTime: 5 * 60_000,
    ...seeded('on-repeat'),
  });
  return { songs: q.data ?? [], isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}
