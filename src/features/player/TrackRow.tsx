import { IonIcon } from '@ionic/react';
import { removeCircleOutline } from 'ionicons/icons';
import { usePlayer } from './usePlayer';
import { trackDuration } from './playerFormat';
import { TrackArt } from './TrackArt';
import { TrackTitle } from './TrackTitle';
import { LikeButton } from '../library/LikeButton';
import { AddToPlaylistButton } from '../playlists/AddToPlaylistButton';
import { TrackReorder } from './TrackReorder';
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
}) {
  const { playQueue, current, isPlaying, toggle } = usePlayer();
  const isCurrent = current?.Id === track.Id;
  return (
    <div
      className={isCurrent ? 'track-row track-row--current' : 'track-row'}
      data-testid="track-row"
    >
      <button
        type="button"
        className="track-row__play"
        data-testid="track-row-play"
        onClick={() => {
          // Tapping the already-playing row pauses/resumes in place (Spotify-
          // style); any other row starts the queue from that track.
          if (isCurrent) {
            toggle();
          } else {
            onPlay?.();
            playQueue(queue, index);
          }
        }}
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
      <LikeButton track={track} />
      {onRemove ? (
        <button
          type="button"
          className="track-row__remove"
          data-testid="track-row-remove"
          aria-label="Remove from playlist"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <IonIcon icon={removeCircleOutline} />
        </button>
      ) : (
        <AddToPlaylistButton track={track} />
      )}
    </div>
  );
}
