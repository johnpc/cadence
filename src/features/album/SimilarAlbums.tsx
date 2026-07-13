import { useHistory } from 'react-router-dom';
import { TrackArt } from '../player/TrackArt';
import { useSimilarAlbums } from './albumApi';
import { useInView } from '../../lib/useInView';
import './moreByArtist.css';

/** "Fans also like" — albums surfaced by this album's instant-mix radio,
 * spanning other artists. The radio call is the app's slowest (~13s), so it's
 * deferred until this section nears the viewport (useInView) rather than fired
 * on mount. Renders a tiny sentinel until then; nothing once the mix is empty. */
export function SimilarAlbums({ albumId }: { albumId: string }) {
  const history = useHistory();
  const { ref, inView } = useInView();
  const { albums } = useSimilarAlbums(albumId, inView);
  if (albums.length === 0) return <div ref={ref} data-testid="similar-albums-sentinel" />;
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
