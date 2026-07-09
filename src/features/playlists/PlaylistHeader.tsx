import { TrackArt } from '../player/TrackArt';
import { CollectionActions } from '../player/CollectionActions';
import { ShareButton } from '../share/ShareButton';
import { GradientHeader } from '../color/GradientHeader';
import { collectionSummary } from '../player/playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The playlist detail header: cover, title, description, song-count summary,
 * and the play/shuffle/queue + share actions. */
export function PlaylistHeader({
  playlist,
  tracks,
}: {
  playlist: JellyfinItem | null;
  tracks: JellyfinItem[];
}) {
  return (
    <>
      <GradientHeader item={playlist}>
        <div className="playlist__header">
          <TrackArt item={playlist} size={160} />
          <h1 className="playlist__title cad-headline" data-testid="playlist-title">
            {playlist?.Name ?? 'Playlist'}
          </h1>
          {playlist?.Overview && (
            <p className="playlist__desc cad-meta" data-testid="playlist-desc">
              {playlist.Overview}
            </p>
          )}
          <p className="cad-meta" data-testid="playlist-summary">
            {collectionSummary(tracks)}
          </p>
        </div>
      </GradientHeader>
      <div className="playlist__actions">
        <CollectionActions tracks={tracks} collectionId={playlist?.Id} />
        <ShareButton item={playlist} />
      </div>
    </>
  );
}
