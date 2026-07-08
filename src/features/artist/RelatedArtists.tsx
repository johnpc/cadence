import { useHistory } from 'react-router-dom';
import { TrackArt } from '../player/TrackArt';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** "Fans also like" — a row of related artists (round art) that navigate to
 * their own pages. Renders nothing when no related artists are found. */
export function RelatedArtists({ artists }: { artists: JellyfinItem[] }) {
  const history = useHistory();
  if (artists.length === 0) return null;
  return (
    <section data-testid="artist-related">
      <h2 className="cad-kicker artist__section">Fans also like</h2>
      <div className="artist__related">
        {artists.map((artist) => (
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
