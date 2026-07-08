import { useHistory } from 'react-router-dom';
import { TrackArt } from '../player/TrackArt';
import { useMoreByArtist } from './albumApi';
import './moreByArtist.css';

/** "More by <artist>" — other albums by this album's artist, linking to each
 * album page. Renders nothing when the artist has no other albums. */
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
  const { albums } = useMoreByArtist(artistId, excludeId);
  if (albums.length === 0) return null;
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
