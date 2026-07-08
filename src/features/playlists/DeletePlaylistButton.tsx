import { IonAlert, IonButton, IonIcon } from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDeletePlaylist } from './playlistsApi';
import { useToast } from '../toast/useToast';

/** The trash button + confirm alert for deleting a playlist. On success it
 * returns to the library. Kept separate so PlaylistDetail stays render-thin. */
export function DeletePlaylistButton({ playlistId }: { playlistId: string }) {
  const history = useHistory();
  const del = useDeletePlaylist();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const onDelete = () =>
    del.mutate(playlistId, {
      onSuccess: () => {
        toast('Playlist deleted');
        history.replace('/library');
      },
    });
  return (
    <>
      <IonButton
        onClick={() => setConfirmOpen(true)}
        data-testid="delete-playlist"
        aria-label="Delete playlist"
      >
        <IonIcon slot="icon-only" icon={trashOutline} />
      </IonButton>
      <IonAlert
        isOpen={confirmOpen}
        header="Delete playlist?"
        message="This removes the playlist from your library."
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          { text: 'Delete', role: 'destructive', handler: onDelete },
        ]}
        onDidDismiss={() => setConfirmOpen(false)}
      />
    </>
  );
}
