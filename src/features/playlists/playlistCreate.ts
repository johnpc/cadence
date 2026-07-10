import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPlaylist,
  createPlaylistWithItems,
  getPlaylistItems,
} from '../../lib/jellyfinPlaylists';
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

/** Clone another user's (public) playlist into one the current user OWNS: read
 * the source's tracks, then create a new playlist with the same tracks under
 * this user. Lets people adopt community playlists into Your Library without the
 * originals being injected there. Returns the new playlist's id. */
export function useClonePlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sourceId, name }: { sourceId: string; name: string }) => {
      const tracks = await getPlaylistItems(sourceId);
      return createPlaylistWithItems(
        name,
        tracks.map((t) => t.Id),
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLAYLISTS_KEY }),
  });
}
