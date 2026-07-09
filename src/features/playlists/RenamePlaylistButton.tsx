import { IonAlert, IonButton, IonIcon } from '@ionic/react';
import { createOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useRenamePlaylist } from './playlistsApi';
import { nextPlaylistName } from './renameName';
import { useToast } from '../toast/useToast';

/** A pencil button + prompt to rename a playlist, prefilled with the current
 * name. Kept separate so PlaylistDetail stays render-thin. */
export function RenamePlaylistButton({
  playlistId,
  currentName,
}: {
  playlistId: string;
  currentName: string;
}) {
  const rename = useRenamePlaylist(playlistId);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <>
      <IonButton
        onClick={() => setOpen(true)}
        data-testid="rename-playlist"
        aria-label="Rename playlist"
      >
        <IonIcon slot="icon-only" icon={createOutline} />
      </IonButton>
      <IonAlert
        isOpen={open}
        header="Rename playlist"
        inputs={[{ name: 'name', type: 'text', value: currentName, placeholder: 'Playlist name' }]}
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Save',
            handler: (data: { name?: string }) => {
              const name = nextPlaylistName(data.name, currentName);
              if (name) rename.mutate(name, { onSuccess: () => toast(`Renamed to "${name}"`) });
            },
          },
        ]}
        onDidDismiss={() => setOpen(false)}
      />
    </>
  );
}
