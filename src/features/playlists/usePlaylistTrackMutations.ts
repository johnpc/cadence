import { useRemoveFromPlaylist, useMovePlaylistItem } from './playlistsApi';
import { useToast } from '../toast/useToast';

/** Remove/reorder mutations for a playlist's tracks, each with a failure toast.
 * Extracted from PlaylistTracks so the component stays a thin renderer (and
 * under the complexity gate). `moveEntry` is a no-op without an entry id. */
export function usePlaylistTrackMutations(playlistId: string) {
  const toast = useToast();
  const remove = useRemoveFromPlaylist(playlistId);
  const move = useMovePlaylistItem(playlistId);
  const onErr = (msg: string) => ({ onError: () => toast(msg) });

  const removeEntry = (entryId: string) =>
    remove.mutate(entryId, onErr("Couldn't remove that song"));

  const moveEntry = (entryId: string | undefined, index: number) => {
    if (entryId) move.mutate({ entryId, index }, onErr("Couldn't reorder the playlist"));
  };

  return { removeEntry, moveEntry };
}
