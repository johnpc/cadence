import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPlaylist, createPlaylistWithItems } from '../../lib/jellyfinPlaylists';
import { PLAYLISTS_KEY } from './playlistsApi';

/** Create a playlist; refreshes the list on success. */
export function useCreatePlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createPlaylist(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLAYLISTS_KEY }),
  });
}

/** Create a playlist pre-filled with tracks (e.g. save the current queue). */
export function useCreatePlaylistWithItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, itemIds }: { name: string; itemIds: string[] }) =>
      createPlaylistWithItems(name, itemIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLAYLISTS_KEY }),
  });
}
