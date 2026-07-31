import { useMemo, useState } from 'react';
import { LoadState } from '../../components/LoadState';
import { AudiobookControls } from './AudiobookControls';
import { BookRow } from './BookRow';
import { groupBooks } from './groupBooks';
import { filterBooks } from './filterBooks';
import { highlightBooks } from './highlightBooks';
import { sortBooks, type BookSort } from './sortBooks';
import { useAudiobookLibrary } from './useAudiobookLibrary';

/** The audiobook library: a search + sort tools row, a "Continue listening &
 * favorites" top section (in-progress + favorited books, resuming where you left
 * off), and the full book list with multi-file books collapsed into one row
 * (groupBooks). Search filters the full list; sort orders it (A–Z / recently
 * added / recently played); the highlights hide while searching. */
export function Audiobooks() {
  const { books, highlights, isLoading, isError, refetch } = useAudiobookLibrary();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<BookSort>('alpha');
  const grouped = useMemo(() => groupBooks(books), [books]);
  const shown = useMemo(() => sortBooks(filterBooks(grouped, query), sort), [grouped, query, sort]);
  // Resolve the raw resumable/favorite PART items to their grouped books, so the
  // top section shows real book rows (not orphan chapter fragments like "Preface").
  const topBooks = useMemo(() => highlightBooks(highlights, grouped), [highlights, grouped]);
  const searching = query.trim().length > 0;

  return (
    <LoadState
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      isEmpty={books.length === 0}
      emptyTitle="No audiobooks"
      emptyMessage="Add audiobooks to your Jellyfin Books library and they'll appear here."
    >
      <div data-testid="audiobooks">
        <AudiobookControls query={query} onQuery={setQuery} sort={sort} onSort={setSort} />
        {!searching && topBooks.length > 0 && (
          <section data-testid="audiobooks-highlights">
            <h2 className="cad-kicker">Continue listening &amp; favorites</h2>
            {topBooks.map((book) => (
              <BookRow key={book.id} book={book} />
            ))}
          </section>
        )}
        <section>
          <h2 className="cad-kicker">{searching ? 'Results' : 'All audiobooks'}</h2>
          {shown.map((book) => (
            <BookRow key={book.id} book={book} />
          ))}
          {searching && shown.length === 0 && (
            <p className="cad-meta" data-testid="audiobook-no-matches">
              No audiobooks match “{query.trim()}”.
            </p>
          )}
        </section>
      </div>
    </LoadState>
  );
}
