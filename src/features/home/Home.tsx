import {
  IonContent,
  IonHeader,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
  type RefresherCustomEvent,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { Shelf } from './Shelf';
import { AlbumCard } from './AlbumCard';
import { greeting } from './greeting';
import { useLatestAlbums, useSuggestedSongs } from './homeApi';
import { usePlayer } from '../player/usePlayer';
import './home.css';

/**
 * Home — the Spotify anti-scroll surface: horizontal shelves of recommendations
 * (recently added albums, suggested songs). No full-library list. Albums open
 * their detail page; suggested songs play immediately.
 */
export function Home() {
  const albums = useLatestAlbums();
  const suggested = useSuggestedSongs();
  const { playQueue } = usePlayer();
  const history = useHistory();

  const onRefresh = async (e: RefresherCustomEvent) => {
    await Promise.all([albums.refetch(), suggested.refetch()]);
    await e.detail.complete();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Cadence</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
          <IonRefresherContent />
        </IonRefresher>
        <h1 className="home__greeting cad-h1" data-testid="home-greeting">
          {greeting(new Date().getHours())}
        </h1>
        <div data-testid="home-shelves">
          <Shelf
            title="Recently added"
            isLoading={albums.isLoading}
            isError={albums.isError}
            onRetry={() => void albums.refetch()}
            isEmpty={albums.albums.length === 0}
          >
            {albums.albums.map((album) => (
              <AlbumCard
                key={album.Id}
                item={album}
                onPlay={() => history.push(`/album/${album.Id}`)}
              />
            ))}
          </Shelf>
          <Shelf
            title="Suggested for you"
            isLoading={suggested.isLoading}
            isError={suggested.isError}
            onRetry={() => void suggested.refetch()}
            isEmpty={suggested.songs.length === 0}
          >
            {suggested.songs.map((song, index) => (
              <AlbumCard
                key={song.Id}
                item={song}
                onPlay={() => playQueue(suggested.songs, index)}
              />
            ))}
          </Shelf>
        </div>
      </IonContent>
    </IonPage>
  );
}
