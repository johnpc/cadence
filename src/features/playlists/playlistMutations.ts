import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  addToPlaylist,
  deletePlaylist,
  movePlaylistItem,
  removeFromPlaylist,
  renamePlaylist,
} from '../../lib/jellyfinPlaylists';
import { PLAYLISTS_KEY } from './playlistsKeys';

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

/** Move an entry within a playlist; refreshes that playlist's items. */
export function useMovePlaylistItem(playlistId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, index }: { entryId: string; index: number }) =>
      movePlaylistItem(playlistId, entryId, index),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playlist-items', playlistId] }),
  });
}

/** Delete a playlist; refreshes the playlists list. */
export function useDeletePlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playlistId: string) => deletePlaylist(playlistId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLAYLISTS_KEY }),
  });
}

/** Rename a playlist; refreshes its header + the playlists list. */
export function useRenamePlaylist(playlistId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => renamePlaylist(playlistId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
      queryClient.invalidateQueries({ queryKey: PLAYLISTS_KEY });
    },
  });
}
