import { Link } from 'react-router-dom';
import './genreChips.css';

/** A small row of genre pills for a detail header — each links to that genre's
 * page (same destination as Search's "Browse all" tiles). Renders nothing when
 * there are no genres. */
export function GenreChips({ genres }: { genres: string[] | undefined }) {
  if (!genres?.length) return null;
  return (
    <div className="genre-chips" data-testid="genre-chips">
      {genres.map((g) => (
        <Link
          key={g}
          className="genre-chips__chip"
          to={`/genre/${encodeURIComponent(g)}`}
          data-testid="genre-chip"
        >
          {g}
        </Link>
      ))}
    </div>
  );
}
