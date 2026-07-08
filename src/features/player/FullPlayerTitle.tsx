import { Link } from 'react-router-dom';
import { artistLine } from './playerFormat';
import { LikeButton } from '../library/LikeButton';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The full player's title block: the track name links to its own song page,
 * with the artist line beneath and a like toggle alongside. */
export function FullPlayerTitle({
  track,
  onNavigate,
}: {
  track: JellyfinItem | null;
  onNavigate: () => void;
}) {
  return (
    <div className="fullplayer__meta">
      <div className="fullplayer__titles">
        {track ? (
          <Link
            className="fullplayer__title cad-headline"
            to={`/song/${track.Id}`}
            onClick={onNavigate}
            data-testid="full-player-song-link"
          >
            {track.Name}
          </Link>
        ) : (
          <p className="fullplayer__title cad-headline" />
        )}
        <p className="fullplayer__artist cad-meta">{artistLine(track)}</p>
      </div>
      {track && <LikeButton track={track} size={26} />}
    </div>
  );
}
