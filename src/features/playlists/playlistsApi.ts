import { useQuery } from '@tanstack/react-query';
import { getPlaylists } from '../../lib/jellyfinPlaylists';
import { getItem } from '../../lib/jellyfinItems';
import { getCachedPlaylistItems, fetchAndCachePlaylistItems } from './playlistItemsCache';
import { PLAYLISTS_KEY } from './playlistsKeys';

// Mutations live in playlistMutations.ts; re-exported so existing imports from
// './playlistsApi' keep working.
export { PLAYLISTS_KEY } from './playlistsKeys';
export {
  useAddToPlaylist,
  useRemoveFromPlaylist,
  useMovePlaylistItem,
  useDeletePlaylist,
  useRenamePlaylist,
} from './playlistMutations';

/** One playlist's header metadata (name, cover art). */
export function usePlaylist(playlistId: string) {
  const q = useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: () => getItem(playlistId),
    staleTime: 60_000,
  });
  return { playlist: q.data ?? null };
}

/** The user's playlists. */
export function usePlaylists() {
  const q = useQuery({ queryKey: PLAYLISTS_KEY, queryFn: getPlaylists, staleTime: 30_000 });
  return {
    playlists: q.data ?? [],
    isLoading: q.isLoading,
    isError: q.isError,
    refetch: q.refetch,
  };
}

/** The tracks in one playlist. Seeds from a localStorage cache so a
 * previously-opened playlist paints INSTANTLY on cold load, then refetches in the
 * background and re-persists (playlists are costly to fetch but change rarely). */
export function usePlaylistItems(playlistId: string) {
  const cached = getCachedPlaylistItems(playlistId);
  const q = useQuery({
    queryKey: ['playlist-items', playlistId],
    queryFn: () => fetchAndCachePlaylistItems(playlistId),
    staleTime: 5 * 60_000,
    initialData: cached,
    initialDataUpdatedAt: cached ? 0 : undefined, // stale → still background-refetches
  });
  return { tracks: q.data ?? [], isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}
