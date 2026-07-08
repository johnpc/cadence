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
import { TrackArt } from '../player/TrackArt';
import { TrackRow } from '../player/TrackRow';
import { CollectionActions } from '../player/CollectionActions';
import { SaveButton } from '../library/SaveButton';
import { artistLine, collectionSummary } from '../player/playerFormat';
import { albumMeta } from './albumMeta';
import { useAlbum, useAlbumTracks } from './albumApi';
import './album.css';

/** One album: header (art + title + artist + play/shuffle) and its tracklist. */
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
        <LoadState
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          isEmpty={tracks.length === 0}
          emptyTitle="This album has no tracks"
          skeleton={<TrackListSkeleton />}
        >
          <div data-testid="album-detail">
            <div className="album__header">
              <TrackArt item={album} size={160} />
              <h1 className="album__title cad-headline">{album?.Name}</h1>
              <p className="album__artist cad-meta">{artistLine(album) || album?.AlbumArtist}</p>
              {albumMeta(album) && (
                <p className="album__info cad-meta" data-testid="album-info">
                  {albumMeta(album)}
                </p>
              )}
              <p className="album__summary cad-meta" data-testid="album-summary">
                {collectionSummary(tracks)}
              </p>
              <div className="album__actions">
                <SaveButton item={album ?? null} />
                <CollectionActions tracks={tracks} />
              </div>
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
