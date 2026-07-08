import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { play } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { LoadState } from '../../components/LoadState';
import { TrackRow } from '../player/TrackRow';
import { usePlayer } from '../player/usePlayer';
import { usePlaylistItems } from './playlistsApi';
import './playlists.css';

/** One playlist: its tracks, playable as a queue. */
export function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const { tracks, isLoading, isError, refetch } = usePlaylistItems(id);
  const { playQueue } = usePlayer();

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
        >
          <div data-testid="playlist-detail">
            <button
              className="playlists__play-all"
              data-testid="playlist-play-all"
              onClick={() => playQueue(tracks, 0)}
              aria-label="Play playlist"
            >
              <IonIcon icon={play} />
            </button>
            {tracks.map((track, index) => (
              <TrackRow key={track.Id} track={track} queue={tracks} index={index} />
            ))}
          </div>
        </LoadState>
      </IonContent>
    </IonPage>
  );
}
