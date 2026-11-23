import { Link } from 'react-router-dom';
import { genreChips } from './genreLabels';
import './genreChips.css';

/** A small row of genre pills for a detail header — each links to that genre's
 * page (same destination as Search's "Browse all" tiles). Raw tags are tidied
 * first (genreLabels): paths shortened, numbers and duplicates dropped, at most
 * four. Renders nothing when no chip survives. */
export function GenreChips({ genres }: { genres: string[] | undefined }) {
  const chips = genreChips(genres);
  if (!chips.length) return null;
  return (
    <div className="genre-chips" data-testid="genre-chips">
      {chips.map((c) => (
        <Link
          key={c.genre}
          className="genre-chips__chip"
          to={`/genre/${encodeURIComponent(c.genre)}`}
          data-testid="genre-chip"
        >
          {c.label}
        </Link>
      ))}
    </div>
  );
}
