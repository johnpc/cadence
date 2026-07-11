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
import { ArtistHeader } from './ArtistHeader';
import { ArtistAlbums } from './ArtistAlbums';
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
        <ArtistHeader
          artist={artist}
          topTracks={topTracks}
          onRadio={() => artist && void playItem(artist)}
        />
        <ArtistPopular tracks={topTracks} artistId={id} artistName={artist?.Name} />
        <ArtistAlbums
          albums={albums}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
        />
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
