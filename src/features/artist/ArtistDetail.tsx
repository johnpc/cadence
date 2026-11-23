import { IonBackButton } from '@ionic/react';
import { BarPage } from '../../components/barPage/BarPage';
import { useParams } from 'react-router-dom';
import { ArtistHeader } from './ArtistHeader';
import { ArtistAlbums } from './ArtistAlbums';
import { ArtistPopular } from './ArtistPopular';
import { RelatedArtists } from './RelatedArtists';
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

  return (
    <BarPage
      kind="detail"
      title={artist?.Name ?? 'Artist'}
      start={<IonBackButton defaultHref="/search" />}
    >
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
      <RelatedArtists artistId={id} />
      {artist?.Overview && (
        <section data-testid="artist-about">
          <h2 className="cad-headline artist__section">About</h2>
          <p className="artist__about cad-meta">{artist.Overview}</p>
        </section>
      )}
    </BarPage>
  );
}
