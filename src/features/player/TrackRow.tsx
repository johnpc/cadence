import { usePlayer } from './usePlayer';
import { artistLine } from './playerFormat';
import { TrackArt } from './TrackArt';
import { LikeButton } from '../library/LikeButton';
import { AddToPlaylistButton } from '../playlists/AddToPlaylistButton';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './trackRow.css';

/**
 * A tappable track row: art + title + artist + a like toggle. Tapping the row
 * plays the whole `queue` starting at this track. Reused across Home, Search,
 * Library, and playlists.
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
  const { playQueue } = usePlayer();
  return (
    <div className="track-row" data-testid="track-row">
      <button
        type="button"
        className="track-row__play"
        data-testid="track-row-play"
        onClick={() => playQueue(queue, index)}
      >
        <TrackArt item={track} size={44} />
        <span className="track-row__meta">
          <span className="track-row__title">{track.Name}</span>
          <span className="track-row__artist">{artistLine(track)}</span>
        </span>
      </button>
      <LikeButton track={track} />
      <AddToPlaylistButton track={track} />
    </div>
  );
}
