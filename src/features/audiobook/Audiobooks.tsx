import { useMemo, useState } from 'react';
import { IonSearchbar } from '@ionic/react';
import { LoadState } from '../../components/LoadState';
import { TrackRow } from '../player/TrackRow';
import { BookRow } from './BookRow';
import { groupBooks } from './groupBooks';
import { filterBooks } from './filterBooks';
import { useAudiobookLibrary } from './useAudiobookLibrary';

/** The audiobook library: a search box, a "Continue listening & favorites" top
 * section (in-progress + favorited books, resuming where you left off), and the
 * full book list with multi-file books collapsed into one row (groupBooks). The
 * search filters the full list; the highlights hide while searching. */
export function Audiobooks() {
  const { books, highlights, isLoading, isError, refetch } = useAudiobookLibrary();
  const [query, setQuery] = useState('');
  const ctx = { kind: 'audiobooks', label: 'Audiobooks', path: '/audiobooks' };
  const grouped = useMemo(() => groupBooks(books), [books]);
  const shown = useMemo(() => filterBooks(grouped, query), [grouped, query]);
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
        <IonSearchbar
          value={query}
          onIonInput={(e) => setQuery(e.detail.value ?? '')}
          placeholder="Find an audiobook"
          data-testid="audiobook-search"
        />
        {!searching && highlights.length > 0 && (
          <section data-testid="audiobooks-highlights">
            <h2 className="cad-kicker">Continue listening &amp; favorites</h2>
            {highlights.map((b, i) => (
              <TrackRow key={b.Id} track={b} queue={highlights} index={i} context={ctx} />
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
