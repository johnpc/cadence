import { useHistory } from 'react-router-dom';
import { TrackArt } from '../player/TrackArt';
import { useRelatedArtists } from './artistApi';
import { useInView } from '../../lib/useInView';

/** "Fans also like" — a row of related artists (round art) that navigate to
 * their own pages. Its data comes from the artist's instant-mix radio, the
 * slowest call on the page, so it's deferred until this section scrolls near
 * view (useInView) rather than firing on mount and blocking the albums/popular
 * tracks. Renders a sentinel until then; nothing when no related artists. */
export function RelatedArtists({ artistId }: { artistId: string }) {
  const history = useHistory();
  const { ref, inView } = useInView();
  const { related } = useRelatedArtists(artistId, inView);
  if (related.length === 0) return <div ref={ref} data-testid="artist-related-sentinel" />;
  return (
    <section data-testid="artist-related">
      <h2 className="cad-kicker artist__section">Fans also like</h2>
      <div className="artist__related">
        {related.map((artist) => (
          <button
            key={artist.Id}
            type="button"
            className="artist__related-card"
            data-testid="related-artist"
            onClick={() => history.push(`/artist/${artist.Id}`)}
          >
            <TrackArt item={artist} size={120} round />
            <span className="artist__related-name">{artist.Name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
