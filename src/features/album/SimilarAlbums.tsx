import { useHistory } from 'react-router-dom';
import { TrackArt } from '../player/TrackArt';
import { useSimilarAlbums } from './albumApi';
import './moreByArtist.css';

/** "Fans also like" — albums surfaced by this album's instant-mix radio,
 * spanning other artists. Renders nothing when the mix yields no siblings. */
export function SimilarAlbums({ albumId }: { albumId: string }) {
  const history = useHistory();
  const { albums } = useSimilarAlbums(albumId);
  if (albums.length === 0) return null;
  return (
    <section data-testid="similar-albums">
      <h2 className="cad-kicker album__section">Fans also like</h2>
      <div className="more-by">
        {albums.map((album) => (
          <button
            key={album.Id}
            type="button"
            className="more-by__album"
            data-testid="similar-album"
            onClick={() => history.push(`/album/${album.Id}`)}
          >
            <TrackArt item={album} size={150} />
            <span className="more-by__name">{album.Name}</span>
            {album.AlbumArtist && <span className="more-by__artist">{album.AlbumArtist}</span>}
          </button>
        ))}
      </div>
    </section>
  );
}
