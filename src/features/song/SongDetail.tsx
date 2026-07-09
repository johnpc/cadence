import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { Link, useParams } from 'react-router-dom';
import { LoadState } from '../../components/LoadState';
import { usePlayer } from '../player/usePlayer';
import { usePlayItem } from '../player/usePlayItem';
import { SongHeader } from './SongHeader';
import { SongAbout } from './SongAbout';
import { SongDetailSkeleton } from './SongDetailSkeleton';
import { useSong, useSongPlaylists, useSongAlbum, useSongArtist } from './songApi';
import './song.css';

/** A track's own page: art, title, links to its artist(s) + album, play/like/
 * share, rich album + artist context cards, and the playlists it appears in. */
export function SongDetail() {
  const { id } = useParams<{ id: string }>();
  const { song, isLoading, isError, refetch } = useSong(id);
  const { playlists } = useSongPlaylists(id);
  const { album } = useSongAlbum(song?.AlbumId);
  const { artist } = useSongArtist(song?.ArtistItems?.[0]?.Id);
  const { playQueue } = usePlayer();
  const playItem = usePlayItem();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>{song?.Name ?? 'Song'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <LoadState
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          skeleton={<SongDetailSkeleton />}
        >
          {song && (
            <div data-testid="song-detail">
              <SongHeader
                song={song}
                onPlay={() => playQueue([song], 0)}
                onRadio={() => void playItem(song)}
              />
              <SongAbout album={album} artist={artist} />
              {playlists.length > 0 && (
                <section data-testid="song-playlists">
                  <h2 className="cad-kicker song__section">Appears in</h2>
                  {playlists.map((pl) => (
                    <Link key={pl.Id} className="song__playlist" to={`/playlist/${pl.Id}`}>
                      {pl.Name}
                    </Link>
                  ))}
                </section>
              )}
            </div>
          )}
        </LoadState>
      </IonContent>
    </IonPage>
  );
}
