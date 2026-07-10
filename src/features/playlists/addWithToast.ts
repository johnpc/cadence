import type { useAddToPlaylist } from './playlistsApi';
import type { ShowToast } from '../toast/ToastContext';

type AddMutation = ReturnType<typeof useAddToPlaylist>;

/** Add a track to a playlist and toast the ACTUAL outcome — success or
 * failure. Toasting eagerly at the tap would claim success even when the
 * write 401s/fails, so the confirmation must ride the mutation callbacks. */
export function addToPlaylistWithToast(
  add: AddMutation,
  toast: ShowToast,
  playlistId: string,
  itemId: string,
  label: string,
) {
  add.mutate(
    { playlistId, itemId },
    {
      onSuccess: () => toast(`Added to ${label}`),
      onError: () => toast(`Couldn't add to ${label}`),
    },
  );
}
