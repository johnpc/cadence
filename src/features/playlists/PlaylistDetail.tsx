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
import { TrackArt } from '../player/TrackArt';
import { TrackRow } from '../player/TrackRow';
import { CollectionActions } from '../player/CollectionActions';
import { collectionSummary } from '../player/playerFormat';
import { DeletePlaylistButton } from './DeletePlaylistButton';
import { usePlaylist, usePlaylistItems, useRemoveFromPlaylist } from './playlistsApi';
import './playlists.css';

/** One playlist: its tracks (playable/removable), plus delete-playlist. */
export function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const { tracks, isLoading, isError, refetch } = usePlaylistItems(id);
  const { playlist } = usePlaylist(id);
  const remove = useRemoveFromPlaylist(id);

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
            <div className="playlist__header">
              <TrackArt item={playlist} size={160} />
              <h1 className="playlist__title cad-headline">{playlist?.Name ?? 'Playlist'}</h1>
              <p className="cad-meta" data-testid="playlist-summary">
                {collectionSummary(tracks)}
              </p>
            </div>
            <CollectionActions tracks={tracks} />
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
              />
            ))}
          </div>
        </LoadState>
      </IonContent>
    </IonPage>
  );
}
