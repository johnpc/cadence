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
import { CardShelf } from './CardShelf';
import { useRecentlyPlayed } from './homeApi';
import { useJumpBackIn } from './useJumpBackIn';
import { usePlayItem } from '../player/usePlayItem';
import { detailPath } from './itemPath';
import './history.css';

/** The full "Recently played" history: the albums/playlists/artists you've
 * played (mixed collections, from the local recent-plays store), then the
 * server-tracked recently-played ALBUMS (Navidrome tracks "recent" at album
 * grain, not per-song). Home shows only a preview of each; this page reaches
 * further and unifies both. */
export function History() {
  const { albums, isLoading, isError, refetch } = useRecentlyPlayed(100);
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
          <CardShelf
            title="Albums"
            items={albums}
            state={{ isLoading, isError, refetch }}
            onOpen={(item) => router.push(`/album/${item.Id}`)}
            onPlay={(item) => void playItem(item)}
          />
        </div>
      </IonContent>
    </IonPage>
  );
}
