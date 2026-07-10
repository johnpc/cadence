import { IonIcon } from '@ionic/react';
import { duplicateOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useClonePlaylist } from './playlistCreate';
import { useToast } from '../toast/useToast';

/** "Add to your library" for a playlist you don't own — clones it into a new
 * playlist you DO own (same tracks), then navigates to your copy. Shown on
 * other users' (community) playlists in place of the owner's edit/delete. */
export function ClonePlaylistButton({ playlistId, name }: { playlistId: string; name: string }) {
  const clone = useClonePlaylist();
  const toast = useToast();
  const history = useHistory();

  const run = () => {
    clone.mutate(
      { sourceId: playlistId, name: `${name} (copy)` },
      {
        onSuccess: (newId) => {
          toast('Added to your library');
          history.replace(`/playlist/${newId}`);
        },
        onError: () => toast('Could not copy playlist'),
      },
    );
  };

  return (
    <button
      type="button"
      className="playlist__clone"
      data-testid="clone-playlist"
      disabled={clone.isPending}
      onClick={run}
    >
      <IonIcon icon={duplicateOutline} /> {clone.isPending ? 'Adding…' : 'Add to your library'}
    </button>
  );
}
