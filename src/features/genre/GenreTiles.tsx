import { useHistory } from 'react-router-dom';
import { GENRES } from './genres';
import './genre.css';

/** "Browse all" — a grid of colourful genre tiles (like Spotify), each opening
 * that genre's page. Shown on the Search idle screen. */
export function GenreTiles() {
  const history = useHistory();
  return (
    <section data-testid="genre-tiles">
      <h2 className="cad-kicker search__section">Browse all</h2>
      <div className="genre-tiles">
        {GENRES.map((genre) => (
          <button
            key={genre.name}
            type="button"
            className="genre-tile"
            data-testid="genre-tile"
            style={{ backgroundColor: genre.color }}
            onClick={() => history.push(`/genre/${encodeURIComponent(genre.name)}`)}
          >
            <span className="genre-tile__name">{genre.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
