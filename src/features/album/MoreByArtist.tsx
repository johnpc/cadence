import { useHistory } from 'react-router-dom';
import { TrackArt } from '../player/TrackArt';
import { useMoreByArtist } from './albumApi';
import { useInView } from '../../lib/useInView';
import './moreByArtist.css';

/** "More by <artist>" — other albums by this album's artist, linking to each
 * album page. Below the fold, so its query is deferred until it scrolls near
 * view (useInView) rather than contending with the album's tracklist on mount.
 * Renders a sentinel until then; nothing when the artist has no other albums. */
export function MoreByArtist({
  artistId,
  artistName,
  excludeId,
}: {
  artistId: string | undefined;
  artistName: string;
  excludeId: string;
}) {
  const history = useHistory();
  const { ref, inView } = useInView();
  const { albums } = useMoreByArtist(artistId, excludeId, inView);
  if (albums.length === 0) return <div ref={ref} data-testid="more-by-artist-sentinel" />;
  return (
    <section data-testid="more-by-artist">
      <h2 className="cad-kicker album__section">More by {artistName}</h2>
      <div className="more-by">
        {albums.map((album) => (
          <button
            key={album.Id}
            type="button"
            className="more-by__album"
            data-testid="more-by-album"
            onClick={() => history.push(`/album/${album.Id}`)}
          >
            <TrackArt item={album} size={150} />
            <span className="more-by__name">{album.Name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
