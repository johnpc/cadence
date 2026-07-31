import { useHistory } from 'react-router-dom';
import { playBook } from './playBook';
import { usePlayer } from '../player/usePlayer';
import { TrackArt } from '../player/TrackArt';
import { DownloadCollectionButton } from '../downloads/DownloadCollectionButton';
import { bookProgress } from './bookProgress';
import { bookProgressLabel } from './bookProgressLabel';
import type { Book } from './groupBooks';
import './bookRow.css';

/** One book in the audiobook library: art + title + author + reading progress
 * (% and time left, or "Finished"), plus a part count for multi-file books.
 * Tapping the row opens the book's detail page; the art acts as a quick PLAY
 * button that starts the whole book as a queue (a single file is a one-item
 * queue) so multi-part books play straight through. Resume applies to the
 * current part (useAudiobookResume). */
export function BookRow({ book }: { book: Book }) {
  const player = usePlayer();
  const history = useHistory();
  const isCurrent = book.parts.some((p) => p.Id === player.current?.Id);
  const author = book.book.AlbumArtist ?? book.book.Artists?.[0] ?? '';
  const multi = book.parts.length > 1;
  const progress = bookProgress(book);
  const progressLabel = bookProgressLabel(progress);
  const open = () => history.push(`/audiobook/${encodeURIComponent(book.id)}`);

  return (
    <div
      className={isCurrent ? 'track-row track-row--current' : 'track-row'}
      data-testid="book-row"
    >
      <button
        type="button"
        className="track-row__art-btn"
        data-testid="book-row-play"
        onClick={() => playBook(player, book)}
        aria-label={`Play ${book.title}`}
      >
        <TrackArt item={book.book} size={44} />
      </button>
      <button type="button" className="track-row__play" onClick={open} data-testid="book-row-open">
        <span className="track-row__meta">
          <span className="track-row__title">{book.title}</span>
          <span className="track-row__artist">
            {author}
            {multi && ` · ${book.parts.length} parts`}
            {progressLabel && <> · {progressLabel}</>}
          </span>
          {progress.started && !progress.completed && (
            <span
              className="book-row__bar"
              data-testid="book-row-progress"
              style={{ ['--frac' as string]: progress.fraction }}
            />
          )}
        </span>
      </button>
      {/* Download the whole book (all chapter-parts) in one tap — same control
          as an album/playlist, so it shows a downloaded/downloading state + % and
          the book then appears in the offline library's Audiobooks section. */}
      <DownloadCollectionButton tracks={book.parts} />
    </div>
  );
}
