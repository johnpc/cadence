import { usePlayer } from '../player/usePlayer';
import { setPlayContext } from '../player/playContext';
import { TrackArt } from '../player/TrackArt';
import { DownloadCollectionButton } from '../downloads/DownloadCollectionButton';
import { bookProgress } from './bookProgress';
import { bookProgressLabel } from './bookProgressLabel';
import type { Book } from './groupBooks';
import './bookRow.css';

/** One book in the audiobook library: art + title + author + reading progress
 * (% and time left, or "Finished"), plus a part count for multi-file books.
 * Tapping it plays the whole book as a queue (a single file is a one-item queue)
 * so multi-part books play straight through and next/prev walk the parts. Resume
 * applies to the current part (useAudiobookResume). */
export function BookRow({ book }: { book: Book }) {
  const { playQueue, current } = usePlayer();
  const isCurrent = book.parts.some((p) => p.Id === current?.Id);
  const author = book.book.AlbumArtist ?? book.book.Artists?.[0] ?? '';
  const multi = book.parts.length > 1;
  const progress = bookProgress(book);
  const progressLabel = bookProgressLabel(progress);

  const play = () => {
    setPlayContext({
      kind: 'audiobook',
      label: book.title,
      path: '/audiobooks',
      tracks: book.parts,
    });
    playQueue(book.parts, 0);
  };

  return (
    <div
      className={isCurrent ? 'track-row track-row--current' : 'track-row'}
      data-testid="book-row"
    >
      <button
        type="button"
        className="track-row__play"
        data-testid="book-row-play"
        onClick={play}
        aria-label={`Play ${book.title}`}
      >
        <TrackArt item={book.book} size={44} />
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
