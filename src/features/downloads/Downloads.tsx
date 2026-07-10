import { LoadState } from '../../components/LoadState';
import { TrackRow } from '../player/TrackRow';
import { CollectionActions } from '../player/CollectionActions';
import { collectionSummary } from '../player/playerFormat';
import { useDownloads } from './useDownloads';

/** The "Downloads" collection — tracks saved for offline playback, read from
 * the local index (no network). Each row's own download button removes it. */
export function Downloads() {
  const { tracks } = useDownloads();
  const context = { kind: 'your library', label: 'Downloads', path: '/downloads' };
  return (
    <LoadState
      isLoading={false}
      isEmpty={tracks.length === 0}
      emptyTitle="No downloads yet"
      emptyMessage="Tap the download icon on any song to save it for offline listening."
    >
      <div data-testid="downloads">
        <div className="liked__header">
          <div className="liked__titles">
            <h1 className="cad-headline">Downloads</h1>
            <p className="cad-meta" data-testid="downloads-summary">
              {collectionSummary(tracks)}
            </p>
          </div>
          <CollectionActions tracks={tracks} context={context} />
        </div>
        {tracks.map((track, index) => (
          <TrackRow key={track.Id} track={track} queue={tracks} index={index} context={context} />
        ))}
      </div>
    </LoadState>
  );
}
