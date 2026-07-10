import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { LoadState } from '../../components/LoadState';
import { TrackListSkeleton } from '../../components/Skeleton';
import { TrackRow } from '../player/TrackRow';
import { CollectionActions } from '../player/CollectionActions';
import { useRecentlyPlayed } from './homeApi';

/** The full "Recently played" history — a scrollable track list (Home shows
 * only the first 20; this page reaches back further), playable as a queue. */
export function History() {
  const { songs, isLoading, isError, refetch } = useRecentlyPlayed(100);
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Recently played</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1 className="cad-sr-only">Recently played</h1>
        <div data-testid="history">
          <LoadState
            isLoading={isLoading}
            isError={isError}
            onRetry={() => void refetch()}
            isEmpty={songs.length === 0}
            emptyTitle="Nothing played yet"
            emptyMessage="Songs you play will show up here."
            skeleton={<TrackListSkeleton />}
          >
            <>
              <CollectionActions tracks={songs} />
              {songs.map((track, index) => (
                <TrackRow key={track.Id} track={track} queue={songs} index={index} />
              ))}
            </>
          </LoadState>
        </div>
      </IonContent>
    </IonPage>
  );
}
