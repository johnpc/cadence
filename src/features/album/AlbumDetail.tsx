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
import { AlbumHeader } from './AlbumHeader';
import { useAlbum, useAlbumTracks } from './albumApi';
import './album.css';

/** One album: header (always shown once metadata loads) + its tracklist. Even
 * when Jellyfin reports no tracks, the header (art, title, artist link) shows. */
export function AlbumDetail() {
  const { id } = useParams<{ id: string }>();
  const { album } = useAlbum(id);
  const { tracks, isLoading, isError, refetch } = useAlbumTracks(id);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>{album?.Name ?? 'Album'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div data-testid="album-detail">
          <AlbumHeader album={album} tracks={tracks} />
          <LoadState
            isLoading={isLoading}
            isError={isError}
            onRetry={() => void refetch()}
            isEmpty={tracks.length === 0}
            emptyTitle="No playable tracks"
            emptyMessage="This album's songs aren't available on your server."
            skeleton={<TrackListSkeleton />}
          >
            <>
              {tracks.map((track, index) => (
                <TrackRow key={track.Id} track={track} queue={tracks} index={index} showNumber />
              ))}
            </>
          </LoadState>
          {album?.Overview && (
            <section data-testid="album-about">
              <h2 className="cad-kicker album__section">About</h2>
              <p className="album__about cad-meta">{album.Overview}</p>
            </section>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
