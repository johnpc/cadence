import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { LoadState } from '../../components/LoadState';
import { TrackArt } from '../player/TrackArt';
import { ArtistHeader } from './ArtistHeader';
import { ArtistPopular } from './ArtistPopular';
import { RelatedArtists } from './RelatedArtists';
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
        <ArtistHeader artist={artist} onRadio={() => artist && void playItem(artist)} />
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
