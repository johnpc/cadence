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
import { radio } from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import { LoadState } from '../../components/LoadState';
import { TrackArt } from '../player/TrackArt';
import { GenreChips } from '../../components/GenreChips';
import { ArtistPopular } from './ArtistPopular';
import { RelatedArtists } from './RelatedArtists';
import { SaveButton } from '../library/SaveButton';
import { ShareButton } from '../share/ShareButton';
import { usePlayItem } from '../player/usePlayItem';
import { useArtist, useArtistAlbums, useArtistTopTracks, useRelatedArtists } from './artistApi';
import './artist.css';

/** One artist: header (art + name + radio), popular tracks, and their albums. */
export function ArtistDetail() {
  const { id } = useParams<{ id: string }>();
  const { artist } = useArtist(id);
  const { albums, isLoading, isError, refetch } = useArtistAlbums(id);
  const { tracks: topTracks } = useArtistTopTracks(id);
  const { related } = useRelatedArtists(id);
  const playItem = usePlayItem();
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/search" />
          </IonButtons>
          <IonTitle>{artist?.Name ?? 'Artist'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="artist__header">
          <TrackArt item={artist} size={160} round />
          <h1 className="artist__name cad-headline">{artist?.Name}</h1>
          <GenreChips genres={artist?.Genres} />
          {artist && (
            <div className="artist__actions" data-testid="artist-actions">
              <SaveButton item={artist} />
              <ShareButton item={artist} />
              <button
                className="artist__radio"
                data-testid="artist-radio"
                onClick={() => void playItem(artist)}
                aria-label="Start artist radio"
              >
                <IonIcon icon={radio} /> Radio
              </button>
            </div>
          )}
        </div>
        <ArtistPopular tracks={topTracks} />
        <h2 className="cad-kicker artist__section">Albums</h2>
        <LoadState
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          isEmpty={albums.length === 0}
          emptyTitle="No albums"
        >
          <div className="artist__albums" data-testid="artist-albums">
            {albums.map((album) => (
              <button
                key={album.Id}
                type="button"
                className="artist__album"
                data-testid="artist-album"
                onClick={() => history.push(`/album/${album.Id}`)}
              >
                <TrackArt item={album} size={150} />
                <span className="artist__album-name">{album.Name}</span>
              </button>
            ))}
          </div>
        </LoadState>
        <RelatedArtists artists={related} />
        {artist?.Overview && (
          <section data-testid="artist-about">
            <h2 className="cad-kicker artist__section">About</h2>
            <p className="artist__about cad-meta">{artist.Overview}</p>
          </section>
        )}
      </IonContent>
    </IonPage>
  );
}
