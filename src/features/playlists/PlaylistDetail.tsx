import {
  IonAlert,
  IonButton,
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { LoadState } from '../../components/LoadState';
import { TrackListSkeleton } from '../../components/Skeleton';
import { TrackRow } from '../player/TrackRow';
import { CollectionActions } from '../player/CollectionActions';
import { usePlaylistItems, useRemoveFromPlaylist, useDeletePlaylist } from './playlistsApi';
import './playlists.css';

/** One playlist: its tracks (playable/removable), plus delete-playlist. */
export function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { tracks, isLoading, isError, refetch } = usePlaylistItems(id);
  const remove = useRemoveFromPlaylist(id);
  const del = useDeletePlaylist();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const onDelete = () =>
    del.mutate(id, {
      onSuccess: () => history.replace('/library'),
    });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/library" />
          </IonButtons>
          <IonTitle>Playlist</IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={() => setConfirmOpen(true)}
              data-testid="delete-playlist"
              aria-label="Delete playlist"
            >
              <IonIcon slot="icon-only" icon={trashOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <LoadState
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          isEmpty={tracks.length === 0}
          emptyTitle="This playlist is empty"
          emptyMessage="Add songs from search or the player."
          skeleton={<TrackListSkeleton />}
        >
          <div data-testid="playlist-detail">
            <CollectionActions tracks={tracks} />
            {tracks.map((track, index) => (
              <TrackRow
                key={track.PlaylistItemId ?? track.Id}
                track={track}
                queue={tracks}
                index={index}
                onRemove={
                  track.PlaylistItemId
                    ? () => remove.mutate(track.PlaylistItemId as string)
                    : undefined
                }
              />
            ))}
          </div>
        </LoadState>
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
      </IonContent>
    </IonPage>
  );
}
