import { IonBackButton } from '@ionic/react';
import { BarPage } from '../../components/barPage/BarPage';
import { useParams } from 'react-router-dom';
import { LoadState } from '../../components/LoadState';
import { TrackListSkeleton } from '../../components/Skeleton';
import { TrackRow } from '../player/TrackRow';
import { CollectionActions } from '../player/CollectionActions';
import { collectionSummary } from '../player/playerFormat';
import { useGenreTracks } from './genreApi';
import { findGenre } from './genres';
import './genre.css';
import { pageTitleProps } from '../../components/barPage/usePageBar';

/** One genre: a colour-washed header with play/shuffle, then its top tracks. */
export function GenreDetail() {
  const { name } = useParams<{ name: string }>();
  const genre = decodeURIComponent(name);
  const { tracks, isLoading, isError, refetch } = useGenreTracks(genre);
  const color = findGenre(genre)?.color ?? 'var(--cad-elevated)';

  return (
    <BarPage kind="detail" title={genre} start={<IonBackButton defaultHref="/search" />}>
      <div data-testid="genre-detail">
        <div className="genre-hero" style={{ backgroundColor: color }}>
          <h1 {...pageTitleProps} className="genre-hero__title cad-headline">
            {genre}
          </h1>
          {tracks.length > 0 && (
            <p className="genre-hero__summary cad-meta" data-testid="genre-summary">
              {collectionSummary(tracks)}
            </p>
          )}
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
            <CollectionActions
              tracks={tracks}
              context={{ kind: 'genre', label: genre, path: `/genre/${name}` }}
            />
            {tracks.map((track, index) => (
              <TrackRow
                key={track.Id}
                track={track}
                queue={tracks}
                index={index}
                context={{ kind: 'genre', label: genre, path: `/genre/${name}` }}
              />
            ))}
          </>
        </LoadState>
      </div>
    </BarPage>
  );
}
