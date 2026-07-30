import { useMemo } from 'react';
import { arrowDownCircle } from 'ionicons/icons';
import { LoadState } from '../../components/LoadState';
import { TrackRow } from '../player/TrackRow';
import { CollectionActions } from '../player/CollectionActions';
import { CollectionHero } from '../library/CollectionHero';
import { collectionSummary } from '../player/playerFormat';
import { BookRow } from '../audiobook/BookRow';
import { groupBooks } from '../audiobook/groupBooks';
import { useDownloads } from './useDownloads';

/** The "Downloads" collection — everything saved for offline playback, read from
 * the local index (no network). Audiobooks are split into their own "Books"
 * section (grouped into whole books, like the offline library) so their chapter
 * parts don't clutter the songs list; music stays a flat, playable track list. */
export function Downloads() {
  const { tracks } = useDownloads();
  const songs = useMemo(() => tracks.filter((t) => t.Type !== 'AudioBook'), [tracks]);
  const books = useMemo(() => groupBooks(tracks.filter((t) => t.Type === 'AudioBook')), [tracks]);
  const context = { kind: 'your library', label: 'Downloads', path: '/downloads' };
  return (
    <LoadState
      isLoading={false}
      isEmpty={tracks.length === 0}
      emptyTitle="No downloads yet"
      emptyMessage="Tap the download icon on any song or book to save it for offline listening."
    >
      <div data-testid="downloads">
        <CollectionHero
          icon={arrowDownCircle}
          title="Downloads"
          summary={collectionSummary(tracks)}
          variant="downloads"
        />
        {books.length > 0 && (
          <section data-testid="downloads-books">
            <h2 className="cad-kicker">Books</h2>
            {books.map((book) => (
              <BookRow key={book.id} book={book} />
            ))}
          </section>
        )}
        {songs.length > 0 && (
          <section data-testid="downloads-songs">
            {books.length > 0 && <h2 className="cad-kicker">Songs</h2>}
            <div className="coll-actions">
              <CollectionActions tracks={songs} context={context} />
            </div>
            {songs.map((track, index) => (
              <TrackRow
                key={track.Id}
                track={track}
                queue={songs}
                index={index}
                context={context}
              />
            ))}
          </section>
        )}
      </div>
    </LoadState>
  );
}
