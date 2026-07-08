import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { LoadState } from '../../components/LoadState';
import { TrackListSkeleton } from '../../components/Skeleton';
import { TrackRow } from '../player/TrackRow';
import { CollectionActions } from '../player/CollectionActions';
import { usePlaylistItems } from './playlistsApi';
import './playlists.css';

/** One playlist: its tracks, playable as a queue. */
export function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const { tracks, isLoading, isError, refetch } = usePlaylistItems(id);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/library" />
          </IonButtons>
          <IonTitle>Playlist</IonTitle>
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
              <TrackRow key={track.Id} track={track} queue={tracks} index={index} />
            ))}
          </div>
        </LoadState>
      </IonContent>
    </IonPage>
  );
}
