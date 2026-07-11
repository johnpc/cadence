import { useHistory } from 'react-router-dom';
import { useAddToPlaylist } from './playlistsApi';
import { trackMenuButtons, type TrackMenuActions } from './trackMenuButtons';
import { usePlayer } from '../player/usePlayer';
import { usePlayItem } from '../player/usePlayItem';
import { useLikeToggle } from '../library/useLikeToggle';
import { useDownload } from '../downloads/useDownload';
import { useToast } from '../toast/useToast';
import { copyShareLink } from '../share/shareLink';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Editable-playlist row extras threaded into the menu (reorder + remove). */
export interface RowEdit {
  onRemove?: () => void;
  reorder?: { isFirst: boolean; isLast: boolean; onMoveUp: () => void; onMoveDown: () => void };
}

/** Wire every "…" track-menu action for a row: like, download, queue, playlist,
 * radio, navigation, copy, and (in an editable playlist) reorder + remove. Kept
 * out of the component so it stays render-only and under the line gate. */
export function useTrackMenuActions(
  track: JellyfinItem,
  openPicker: () => void,
  edit: RowEdit = {},
): { buttons: ReturnType<typeof trackMenuButtons>; add: ReturnType<typeof useAddToPlaylist> } {
  const { playNext, addToQueue } = usePlayer();
  const playItem = usePlayItem();
  const toast = useToast();
  const history = useHistory();
  const like = useLikeToggle(track);
  const download = useDownload(track);
  const add = useAddToPlaylist();
  const r = edit.reorder;

  const actions: TrackMenuActions = {
    playNext: () => {
      playNext(track);
      toast('Playing next');
    },
    addToQueue: () => {
      addToQueue(track);
      toast('Added to queue');
    },
    addToPlaylist: openPicker,
    startRadio: () => {
      void playItem(track);
      toast('Starting radio');
    },
    goToAlbum: () => history.push(`/album/${track.AlbumId}`),
    goToArtist: () => history.push(`/artist/${track.ArtistItems?.[0]?.Id}`),
    copyLink: () =>
      void copyShareLink(track, window.location.origin).then((ok) =>
        toast(ok ? 'Link copied' : 'Could not copy link'),
      ),
    toggleLike: like.toggle,
    liked: like.liked,
    toggleDownload: download.toggle,
    downloaded: download.state === 'downloaded',
    moveUp: r && !r.isFirst ? r.onMoveUp : undefined,
    moveDown: r && !r.isLast ? r.onMoveDown : undefined,
    removeFromPlaylist: edit.onRemove,
  };
  return { buttons: trackMenuButtons(track, actions), add };
}
