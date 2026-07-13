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
import { usePlayer } from '../player/usePlayer';
import { usePlayItem } from '../player/usePlayItem';
import { SongHeader } from './SongHeader';
import { SongAbout } from './SongAbout';
import { SongLyrics } from './SongLyrics';
import { SongPlaylists } from './SongPlaylists';
import { SongDetailSkeleton } from './SongDetailSkeleton';
import { useSong, useSongAlbum, useSongArtist } from './songApi';
import './song.css';

/** A track's own page: art, title, links to its artist(s) + album, play/like/
 * share, rich album + artist context cards, and the playlists it appears in. */
export function SongDetail() {
  const { id } = useParams<{ id: string }>();
  const { song, isLoading, isError, refetch } = useSong(id);
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
          isEmpty={!song}
          emptyTitle="Song not found"
          emptyMessage="This track may have been removed from your server."
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
              <SongLyrics song={song} />
              <SongPlaylists songId={id} />
            </div>
          )}
        </LoadState>
      </IonContent>
    </IonPage>
  );
}
