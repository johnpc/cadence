import { usePlayer } from '../player/usePlayer';
import { setPlayContext } from '../player/playContext';
import { TrackArt } from '../player/TrackArt';
import { TrackDownloadBadge } from '../downloads/TrackDownloadBadge';
import type { Book } from './groupBooks';

/** One book in the audiobook library: art + title + author, plus a part count
 * for multi-file books. Tapping it plays the whole book as a queue (a single
 * file is a one-item queue) so multi-part books play straight through and
 * next/prev walk the parts. Resume applies to the current part (useAudiobookResume). */
export function BookRow({ book }: { book: Book }) {
  const { playQueue, current } = usePlayer();
  const isCurrent = book.parts.some((p) => p.Id === current?.Id);
  const author = book.book.AlbumArtist ?? book.book.Artists?.[0] ?? '';
  const multi = book.parts.length > 1;

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
          </span>
        </span>
      </button>
      <TrackDownloadBadge id={book.book.Id} />
    </div>
  );
}
