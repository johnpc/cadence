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
import { PlaylistHeader } from './PlaylistHeader';
import { PlaylistTracks } from './PlaylistTracks';
import { RecommendedSongs } from './RecommendedSongs';
import { DeletePlaylistButton } from './DeletePlaylistButton';
import { RenamePlaylistButton } from './RenamePlaylistButton';
import { usePlaylist, usePlaylistItems } from './playlistsApi';
import './playlists.css';

/** One playlist: its tracks (playable/removable/filterable), plus delete. */
export function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const { tracks, isLoading, isError, refetch } = usePlaylistItems(id);
  const { playlist } = usePlaylist(id);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/library" />
          </IonButtons>
          <IonTitle>Playlist</IonTitle>
          <IonButtons slot="end">
            {playlist && <RenamePlaylistButton playlistId={id} currentName={playlist.Name ?? ''} />}
            <DeletePlaylistButton playlistId={id} />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <LoadState
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
          isEmpty={tracks.length === 0}
          emptyTitle="This playlist is empty"
          emptyMessage="Add songs from search or the player."
          skeleton={<TrackListSkeleton />}
        >
          <div data-testid="playlist-detail">
            <PlaylistHeader playlist={playlist} tracks={tracks} />
            <PlaylistTracks playlistId={id} tracks={tracks} />
            <RecommendedSongs playlistId={id} tracks={tracks} />
          </div>
        </LoadState>
      </IonContent>
    </IonPage>
  );
}
