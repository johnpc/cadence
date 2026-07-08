import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addToPlaylist,
  createPlaylist,
  getPlaylistItems,
  getPlaylists,
  removeFromPlaylist,
} from '../../lib/jellyfinPlaylists';

export const PLAYLISTS_KEY = ['playlists'];

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

/** The tracks in one playlist. */
export function usePlaylistItems(playlistId: string) {
  const q = useQuery({
    queryKey: ['playlist-items', playlistId],
    queryFn: () => getPlaylistItems(playlistId),
    staleTime: 30_000,
  });
  return { tracks: q.data ?? [], isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}

/** Create a playlist; refreshes the list on success. */
export function useCreatePlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createPlaylist(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLAYLISTS_KEY }),
  });
}

/** Add a track to a playlist; refreshes that playlist's items. */
export function useAddToPlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, itemId }: { playlistId: string; itemId: string }) =>
      addToPlaylist(playlistId, itemId),
    onSuccess: (_r, { playlistId }) =>
      queryClient.invalidateQueries({ queryKey: ['playlist-items', playlistId] }),
  });
}

/** Remove an entry from a playlist; refreshes that playlist's items. */
export function useRemoveFromPlaylist(playlistId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => removeFromPlaylist(playlistId, entryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlist-items', playlistId] }),
  });
}
