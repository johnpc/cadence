import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The artist(s) · album line under a song title, with each part linked to its
 * detail page. Falls back to plain text where an id is missing. */
export function SongLinks({ song }: { song: JellyfinItem }) {
  const artists = song.ArtistItems ?? [];
  return (
    <p className="song__links cad-meta" data-testid="song-links">
      {artists.map((a, i) => (
        <Fragment key={a.Id}>
          {i > 0 && ', '}
          <Link className="song__link" to={`/artist/${a.Id}`}>
            {a.Name}
          </Link>
        </Fragment>
      ))}
      {song.AlbumId && song.Album && (
        <>
          {artists.length > 0 && ' · '}
          <Link className="song__link" to={`/album/${song.AlbumId}`}>
            {song.Album}
          </Link>
        </>
      )}
    </p>
  );
}
