import { usePlayer } from './usePlayer';
import { setPlayContext, collectionIdFromContext } from './playContext';
import { touchRecentPlay } from '../library/recentPlays';
import { trackDuration } from './playerFormat';
import { TrackArt } from './TrackArt';
import { TrackTitle } from './TrackTitle';
import { AddToPlaylistButton } from '../playlists/AddToPlaylistButton';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './trackRow.css';

/**
 * A tappable track row: art + title + artist + duration + a single "…" menu that
 * holds every per-track action (like, download, queue, playlist, radio,
 * navigate, and — in an editable playlist — reorder + remove). Keeping actions
 * in the menu leaves room for the title/artist on narrow screens. Tapping the
 * row plays the whole `queue` starting at this track; the current track is
 * marked with the accent colour + an equalizer glyph. Reused everywhere.
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
    if (context) {
      setPlayContext({ ...context, tracks: queue });
      // Playing a track from within a collection bubbles THAT collection up Your
      // Library's recents (same as tapping the collection's own play button).
      const collectionId = collectionIdFromContext(context);
      if (collectionId) touchRecentPlay(collectionId, Date.now());
    }
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
      <AddToPlaylistButton track={track} edit={{ onRemove, reorder }} />
    </div>
  );
}
