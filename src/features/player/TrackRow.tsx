import { usePlayer } from './usePlayer';
import { artistLine } from './playerFormat';
import { TrackArt } from './TrackArt';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './trackRow.css';

/**
 * A tappable track row: art + title + artist. Tapping plays the whole `queue`
 * starting at this track, so a list plays through in order. Reused across Home,
 * Search, Library, and playlists.
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
    <button
      type="button"
      className="track-row"
      data-testid="track-row"
      onClick={() => playQueue(queue, index)}
    >
      <TrackArt item={track} size={44} />
      <span className="track-row__meta">
        <span className="track-row__title">{track.Name}</span>
        <span className="track-row__artist">{artistLine(track)}</span>
      </span>
    </button>
  );
}
