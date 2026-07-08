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
}: {
  track: JellyfinItem;
  queue: JellyfinItem[];
  index: number;
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
        onClick={() => playQueue(queue, index)}
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
      <AddToPlaylistButton track={track} />
    </div>
  );
}
