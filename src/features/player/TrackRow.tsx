import { usePlayer } from './usePlayer';
import { setPlayContext } from './playContext';
import { trackDuration } from './playerFormat';
import { TrackArt } from './TrackArt';
import { TrackTitle } from './TrackTitle';
import { LikeButton } from '../library/LikeButton';
import { DownloadButton } from '../downloads/DownloadButton';
import { AddToPlaylistButton } from '../playlists/AddToPlaylistButton';
import { TrackReorder } from './TrackReorder';
import { TrackRemoveButton } from './TrackRemoveButton';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './trackRow.css';

/**
 * A tappable track row: art + title + artist + like + add-to-playlist. Tapping
 * the row plays the whole `queue` starting at this track. The currently-playing
 * track is marked with the accent colour + an equalizer glyph. Reused across
 * Home, Search, Library, and playlists.
 */
export function TrackRow({
  track,
  queue,
  index,
  onPlay,
  onRemove,
  reorder,
  showNumber,
  context,
}: {
  track: JellyfinItem;
  queue: JellyfinItem[];
  index: number;
  /** Optional side-effect fired when the row is played (e.g. record a recent). */
  onPlay?: () => void;
  /** When set, shows a remove button (e.g. remove from this playlist). */
  onRemove?: () => void;
  /** When set, shows up/down reorder controls (editable playlist). */
  reorder?: { isFirst: boolean; isLast: boolean; onMoveUp: () => void; onMoveDown: () => void };
  /** Show the track's album number instead of its cover art (album view). */
  showNumber?: boolean;
  /** When set, tapping a row records the "Playing from …" source for the queue
   * (optionally with a route back to it, shown as a link in the full player). */
  context?: { kind: string; label: string; path?: string };
}) {
  const { playQueue, current, isPlaying, toggle } = usePlayer();
  const isCurrent = current?.Id === track.Id;
  // Tap the playing row to pause in place; any other row starts the queue here.
  const onRowPlay = () => {
    if (isCurrent) return toggle();
    onPlay?.();
    if (context) setPlayContext({ ...context, tracks: queue });
    playQueue(queue, index);
  };
  return (
    <div
      className={isCurrent ? 'track-row track-row--current' : 'track-row'}
      data-testid="track-row"
    >
      <button
        type="button"
        className="track-row__play"
        data-testid="track-row-play"
        onClick={onRowPlay}
        aria-label={isCurrent && isPlaying ? `Pause ${track.Name}` : `Play ${track.Name}`}
      >
        {showNumber && track.IndexNumber ? (
          <span className="track-row__num" data-testid="track-number">
            {track.IndexNumber}
          </span>
        ) : (
          <TrackArt item={track} size={44} />
        )}
        <TrackTitle track={track} isCurrent={isCurrent} isPlaying={isPlaying} />
      </button>
      {trackDuration(track.RunTimeTicks) && (
        <span className="track-row__duration cad-meta" data-testid="track-duration">
          {trackDuration(track.RunTimeTicks)}
        </span>
      )}
      {reorder && <TrackReorder {...reorder} />}
      <DownloadButton track={track} />
      <LikeButton track={track} />
      {onRemove ? <TrackRemoveButton onRemove={onRemove} /> : <AddToPlaylistButton track={track} />}
    </div>
  );
}
