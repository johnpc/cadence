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
import { CollectionActions } from '../player/CollectionActions';
import { useGenreTracks } from './genreApi';
import { findGenre } from './genres';
import './genre.css';

/** One genre: a colour-washed header with play/shuffle, then its top tracks. */
export function GenreDetail() {
  const { name } = useParams<{ name: string }>();
  const genre = decodeURIComponent(name);
  const { tracks, isLoading, isError, refetch } = useGenreTracks(genre);
  const color = findGenre(genre)?.color ?? 'var(--cad-elevated)';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/search" />
          </IonButtons>
          <IonTitle>{genre}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div data-testid="genre-detail">
          <div className="genre-hero" style={{ backgroundColor: color }}>
            <h1 className="genre-hero__title cad-headline">{genre}</h1>
          </div>
          <LoadState
            isLoading={isLoading}
            isError={isError}
            onRetry={() => void refetch()}
            isEmpty={tracks.length === 0}
            emptyTitle="No tracks"
            emptyMessage="No songs in this genre on your server."
            skeleton={<TrackListSkeleton />}
          >
            <>
              <CollectionActions tracks={tracks} context={{ kind: 'genre', label: genre }} />
              {tracks.map((track, index) => (
                <TrackRow key={track.Id} track={track} queue={tracks} index={index} />
              ))}
            </>
          </LoadState>
        </div>
      </IonContent>
    </IonPage>
  );
}
