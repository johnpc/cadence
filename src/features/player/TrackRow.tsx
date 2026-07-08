import { IonIcon } from '@ionic/react';
import { removeCircleOutline } from 'ionicons/icons';
import { usePlayer } from './usePlayer';
import { artistLine } from './playerFormat';
import { TrackArt } from './TrackArt';
import { LikeButton } from '../library/LikeButton';
import { AddToPlaylistButton } from '../playlists/AddToPlaylistButton';
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
}: {
  track: JellyfinItem;
  queue: JellyfinItem[];
  index: number;
  /** Optional side-effect fired when the row is played (e.g. record a recent). */
  onPlay?: () => void;
  /** When set, shows a remove button (e.g. remove from this playlist). */
  onRemove?: () => void;
}) {
  const { playQueue, current, isPlaying } = usePlayer();
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
          onPlay?.();
          playQueue(queue, index);
        }}
      >
        <TrackArt item={track} size={44} />
        <span className="track-row__meta">
          <span className="track-row__title">
            {isCurrent && (
              <span
                className={isPlaying ? 'track-row__eq track-row__eq--on' : 'track-row__eq'}
                aria-hidden="true"
              >
                <i />
                <i />
                <i />
              </span>
            )}
            {track.Name}
          </span>
          <span className="track-row__artist">{artistLine(track)}</span>
        </span>
      </button>
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
