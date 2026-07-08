import './genreChips.css';

/** A small row of genre pills for a detail header. Renders nothing when there
 * are no genres. Purely presentational — genres aren't yet navigable. */
export function GenreChips({ genres }: { genres: string[] | undefined }) {
  if (!genres?.length) return null;
  return (
    <div className="genre-chips" data-testid="genre-chips">
      {genres.map((g) => (
        <span key={g} className="genre-chips__chip">
          {g}
        </span>
      ))}
    </div>
  );
}
