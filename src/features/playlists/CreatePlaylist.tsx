import { useState } from 'react';
import { IonAlert, IonButton, IonIcon } from '@ionic/react';
import { add } from 'ionicons/icons';
import { useCreatePlaylist } from './playlistCreate';
import { useToast } from '../toast/useToast';

/** A "+" that prompts for a name and creates a playlist. */
export function CreatePlaylist() {
  const [open, setOpen] = useState(false);
  const create = useCreatePlaylist();
  const toast = useToast();
  return (
    <>
      <IonButton
        fill="clear"
        onClick={() => setOpen(true)}
        data-testid="create-playlist"
        aria-label="Create playlist"
      >
        <IonIcon slot="icon-only" icon={add} />
      </IonButton>
      <IonAlert
        isOpen={open}
        header="New playlist"
        inputs={[{ name: 'name', type: 'text', placeholder: 'Playlist name' }]}
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Create',
            handler: (data: { name?: string }) => {
              const name = (data.name ?? '').trim();
              if (name) {
                create.mutate(name);
                toast(`Created "${name}"`);
              }
            },
          },
        ]}
        onDidDismiss={() => setOpen(false)}
      />
    </>
  );
}
