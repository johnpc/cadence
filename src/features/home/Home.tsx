import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { Shelf } from './Shelf';
import { AlbumCard } from './AlbumCard';
import { useLatestAlbums, useSuggestedSongs } from './homeApi';
import { usePlayItem } from '../player/usePlayItem';
import { usePlayer } from '../player/usePlayer';

/**
 * Home — the Spotify anti-scroll surface: horizontal shelves of recommendations
 * (recently added albums, suggested songs). No full-library list.
 */
export function Home() {
  const albums = useLatestAlbums();
  const suggested = useSuggestedSongs();
  const playItem = usePlayItem();
  const { playQueue } = usePlayer();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Cadence</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div data-testid="home-shelves">
          <Shelf
            title="Recently added"
            isLoading={albums.isLoading}
            isError={albums.isError}
            onRetry={() => void albums.refetch()}
            isEmpty={albums.albums.length === 0}
          >
            {albums.albums.map((album) => (
              <AlbumCard key={album.Id} item={album} onPlay={playItem} />
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
