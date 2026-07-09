import { Link } from 'react-router-dom';
import { TrackArt } from '../player/TrackArt';
import { albumMeta } from '../album/albumMeta';
import { clampText } from './songMeta';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The rich context cards below a song: the album it's from and the artist who
 * made it — each with art, a meta/bio snippet, and a link to its detail page.
 * Renders only the cards whose item resolved (a track may lack either). */
export function SongAbout({
  album,
  artist,
}: {
  album: JellyfinItem | null;
  artist: JellyfinItem | null;
}) {
  if (!album && !artist) return null;
  return (
    <section className="song__about" data-testid="song-about">
      {album && (
        <Link className="song-about__card" data-testid="song-about-album" to={`/album/${album.Id}`}>
          <TrackArt item={album} size={96} />
          <div className="song-about__body">
            <span className="cad-kicker">From the album</span>
            <span className="song-about__name">{album.Name}</span>
            {albumMeta(album) && <span className="cad-meta">{albumMeta(album)}</span>}
          </div>
        </Link>
      )}
      {artist && (
        <Link
          className="song-about__card"
          data-testid="song-about-artist"
          to={`/artist/${artist.Id}`}
        >
          <TrackArt item={artist} size={96} round />
          <div className="song-about__body">
            <span className="cad-kicker">About the artist</span>
            <span className="song-about__name">{artist.Name}</span>
            {artist.Overview && <span className="cad-meta">{clampText(artist.Overview, 160)}</span>}
          </div>
        </Link>
      )}
    </section>
  );
}
