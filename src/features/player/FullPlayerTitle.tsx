import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { artistLine } from './playerFormat';
import { LikeButton } from '../library/LikeButton';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The full player's title block: the track name links to its own song page,
 * the artist(s) beneath link to their artist pages, and a like toggle sits
 * alongside. Falls back to a plain artist line when no artist ids are present. */
export function FullPlayerTitle({
  track,
  onNavigate,
}: {
  track: JellyfinItem | null;
  onNavigate: () => void;
}) {
  const artists = (track?.ArtistItems ?? []).filter((a) => a.Id && a.Name);
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
        <p className="fullplayer__artist cad-meta" data-testid="full-player-artists">
          {artists.length > 0
            ? artists.map((a, i) => (
                <Fragment key={a.Id}>
                  {i > 0 && ', '}
                  <Link
                    className="fullplayer__artist-link"
                    to={`/artist/${a.Id}`}
                    onClick={onNavigate}
                  >
                    {a.Name}
                  </Link>
                </Fragment>
              ))
            : artistLine(track)}
        </p>
      </div>
      {track && <LikeButton track={track} size={26} />}
    </div>
  );
}
