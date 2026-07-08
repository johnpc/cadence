import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { LoadState } from '../../components/LoadState';
import { TrackRow } from '../player/TrackRow';
import { useHomeTracks } from './homeApi';

/**
 * Home. For now a simple play-through list of library tracks; slice 7 turns
 * this into Spotify-style recommendation shelves (recently added, radio…).
 */
export function Home() {
  const { tracks, isLoading, isError, refetch } = useHomeTracks();
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Cadence</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <LoadState
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          isEmpty={tracks.length === 0}
          emptyTitle="No music yet"
          emptyMessage="Your Jellyfin library has no audio tracks."
        >
          <div data-testid="home-tracks">
            {tracks.map((track, index) => (
              <TrackRow key={track.Id} track={track} queue={tracks} index={index} />
            ))}
          </div>
        </LoadState>
      </IonContent>
    </IonPage>
  );
}
