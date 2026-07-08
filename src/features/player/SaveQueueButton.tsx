import { useState } from 'react';
import { IonAlert } from '@ionic/react';
import { useCreatePlaylistWithItems } from '../playlists/playlistCreate';
import { useToast } from '../toast/useToast';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** "Save as playlist" — turns the current queue into a new playlist in one tap
 * (prompts for a name). Renders nothing when the queue is empty. */
export function SaveQueueButton({ queue }: { queue: JellyfinItem[] }) {
  const [open, setOpen] = useState(false);
  const save = useCreatePlaylistWithItems();
  const toast = useToast();
  if (queue.length === 0) return null;
  return (
    <>
      <button
        type="button"
        className="queueview__save"
        data-testid="queue-save"
        onClick={() => setOpen(true)}
      >
        Save as playlist
      </button>
      <IonAlert
        isOpen={open}
        header="Save queue as playlist"
        inputs={[{ name: 'name', type: 'text', placeholder: 'Playlist name' }]}
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Save',
            handler: (data: { name?: string }) => {
              const name = (data.name ?? '').trim();
              if (!name) return;
              save.mutate({ name, itemIds: queue.map((t) => t.Id) });
              toast(`Saved "${name}"`);
            },
          },
        ]}
        onDidDismiss={() => setOpen(false)}
      />
    </>
  );
}
