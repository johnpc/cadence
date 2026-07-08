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
import { PlaylistHeader } from './PlaylistHeader';
import { RecommendedSongs } from './RecommendedSongs';
import { DeletePlaylistButton } from './DeletePlaylistButton';
import {
  usePlaylist,
  usePlaylistItems,
  useRemoveFromPlaylist,
  useMovePlaylistItem,
} from './playlistsApi';
import './playlists.css';

/** One playlist: its tracks (playable/removable), plus delete-playlist. */
export function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const { tracks, isLoading, isError, refetch } = usePlaylistItems(id);
  const { playlist } = usePlaylist(id);
  const remove = useRemoveFromPlaylist(id);
  const move = useMovePlaylistItem(id);
  const moveEntry = (entryId: string | undefined, index: number) => {
    if (entryId) move.mutate({ entryId, index });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/library" />
          </IonButtons>
          <IonTitle>Playlist</IonTitle>
          <IonButtons slot="end">
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
            {tracks.map((track, index) => (
              <TrackRow
                key={track.PlaylistItemId ?? track.Id}
                track={track}
                queue={tracks}
                index={index}
                onRemove={
                  track.PlaylistItemId
                    ? () => remove.mutate(track.PlaylistItemId as string)
                    : undefined
                }
                reorder={{
                  isFirst: index === 0,
                  isLast: index === tracks.length - 1,
                  onMoveUp: () => moveEntry(track.PlaylistItemId, index - 1),
                  onMoveDown: () => moveEntry(track.PlaylistItemId, index + 1),
                }}
              />
            ))}
            <RecommendedSongs playlistId={id} tracks={tracks} />
          </div>
        </LoadState>
      </IonContent>
    </IonPage>
  );
}
