import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useHistory as useRouterHistory } from 'react-router-dom';
import { LoadState } from '../../components/LoadState';
import { TrackListSkeleton } from '../../components/Skeleton';
import { TrackRow } from '../player/TrackRow';
import { CollectionActions } from '../player/CollectionActions';
import { CardShelf } from './CardShelf';
import { useRecentlyPlayed } from './homeApi';
import { useJumpBackIn } from './useJumpBackIn';
import { usePlayItem } from '../player/usePlayItem';
import { detailPath } from './itemPath';
import './history.css';

/** The full "Recently played" history: the albums/playlists/artists you've
 * played (mixed collections, from the local recent-plays store) as a card shelf,
 * then the full scrollable track history (server DatePlayed). Home shows only a
 * preview of each; this page reaches further and unifies both types. */
export function History() {
  const { songs, isLoading, isError, refetch } = useRecentlyPlayed(100);
  const collections = useJumpBackIn();
  const playItem = usePlayItem();
  const router = useRouterHistory();
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
          {collections.items.length > 0 && (
            <CardShelf
              title="Albums, playlists & artists"
              items={collections.items}
              state={collections}
              onOpen={(item) => router.push(detailPath(item))}
              onPlay={(item) => void playItem(item)}
            />
          )}
          <h2 className="cad-kicker history__songs" data-testid="history-songs-title">
            Songs
          </h2>
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
