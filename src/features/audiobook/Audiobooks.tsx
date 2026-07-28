import { useMemo } from 'react';
import { LoadState } from '../../components/LoadState';
import { TrackRow } from '../player/TrackRow';
import { BookRow } from './BookRow';
import { groupBooks } from './groupBooks';
import { useAudiobookLibrary } from './useAudiobookLibrary';

/** The audiobook library browse view: a "Continue listening" section (the exact
 * in-progress parts, which resume where you left off — see useAudiobookResume)
 * followed by every book, with multi-file books collapsed into a single row that
 * plays all parts in order (groupBooks). */
export function Audiobooks() {
  const { books, resumable, isLoading, isError, refetch } = useAudiobookLibrary();
  const ctx = { kind: 'audiobooks', label: 'Audiobooks', path: '/audiobooks' };
  const grouped = useMemo(() => groupBooks(books), [books]);
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
        {resumable.length > 0 && (
          <section data-testid="audiobooks-continue">
            <h2 className="cad-kicker">Continue listening</h2>
            {resumable.map((b, i) => (
              <TrackRow key={b.Id} track={b} queue={resumable} index={i} context={ctx} />
            ))}
          </section>
        )}
        <section>
          <h2 className="cad-kicker">All audiobooks</h2>
          {grouped.map((book) => (
            <BookRow key={book.id} book={book} />
          ))}
        </section>
      </div>
    </LoadState>
  );
}
