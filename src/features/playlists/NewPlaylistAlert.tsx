import { IonAlert } from '@ionic/react';
import { useCreatePlaylistWithItems } from './playlistCreate';
import { useToast } from '../toast/useToast';

/** The "New playlist" name prompt shared by the track "…" menu and the
 * now-playing menu: creates a playlist seeded with `itemId` and toasts. Kept as
 * one component so each menu stays a thin shell (and under the line limit). */
export function NewPlaylistAlert({
  open,
  onClose,
  itemId,
}: {
  open: boolean;
  onClose: () => void;
  itemId: string;
}) {
  const createWith = useCreatePlaylistWithItems();
  const toast = useToast();
  return (
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
            if (name)
              createWith.mutate(
                { name, itemIds: [itemId] },
                {
                  onSuccess: () => toast(`Created "${name}"`),
                  onError: () => toast("Couldn't create the playlist"),
                },
              );
          },
        },
      ]}
      onDidDismiss={onClose}
    />
  );
}
