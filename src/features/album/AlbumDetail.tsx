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
import { TrackArt } from '../player/TrackArt';
import { TrackRow } from '../player/TrackRow';
import { usePlayer } from '../player/usePlayer';
import { artistLine } from '../player/playerFormat';
import { useAlbum, useAlbumTracks } from './albumApi';
import './album.css';

/** One album: header (art + title + artist + play-all) and its tracklist. */
export function AlbumDetail() {
  const { id } = useParams<{ id: string }>();
  const { album } = useAlbum(id);
  const { tracks, isLoading, isError, refetch } = useAlbumTracks(id);
  const { playQueue } = usePlayer();

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
        <LoadState
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          isEmpty={tracks.length === 0}
          emptyTitle="This album has no tracks"
        >
          <div data-testid="album-detail">
            <div className="album__header">
              <TrackArt item={album} size={160} />
              <h1 className="album__title cad-headline">{album?.Name}</h1>
              <p className="album__artist cad-meta">{artistLine(album) || album?.AlbumArtist}</p>
              <button
                className="album__play"
                data-testid="album-play-all"
                onClick={() => playQueue(tracks, 0)}
                aria-label="Play album"
              >
                <IonIcon icon={play} />
              </button>
            </div>
            {tracks.map((track, index) => (
              <TrackRow key={track.Id} track={track} queue={tracks} index={index} />
            ))}
          </div>
        </LoadState>
      </IonContent>
    </IonPage>
  );
}
