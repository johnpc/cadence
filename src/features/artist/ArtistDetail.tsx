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
import { TrackRow } from '../player/TrackRow';
import { usePlayItem } from '../player/usePlayItem';
import { useArtist, useArtistAlbums, useArtistTopTracks } from './artistApi';
import './artist.css';

/** One artist: header (art + name + radio), popular tracks, and their albums. */
export function ArtistDetail() {
  const { id } = useParams<{ id: string }>();
  const { artist } = useArtist(id);
  const { albums, isLoading, isError, refetch } = useArtistAlbums(id);
  const { tracks: topTracks } = useArtistTopTracks(id);
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
          <TrackArt item={artist} size={160} />
          <h1 className="artist__name cad-headline">{artist?.Name}</h1>
          {artist && (
            <button
              className="artist__radio"
              data-testid="artist-radio"
              onClick={() => void playItem(artist)}
              aria-label="Start artist radio"
            >
              <IonIcon icon={radio} /> Radio
            </button>
          )}
        </div>
        {topTracks.length > 0 && (
          <section data-testid="artist-top">
            <h2 className="cad-kicker artist__section">Popular</h2>
            {topTracks.map((track, index) => (
              <TrackRow key={track.Id} track={track} queue={topTracks} index={index} />
            ))}
          </section>
        )}
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
      </IonContent>
    </IonPage>
  );
}
