import { artistLine } from './playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The title + artist lines of a track row, with an animated equalizer glyph
 * when this is the currently-playing track. */
export function TrackTitle({
  track,
  isCurrent,
  isPlaying,
}: {
  track: JellyfinItem;
  isCurrent: boolean;
  isPlaying: boolean;
}) {
  return (
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
  );
}
