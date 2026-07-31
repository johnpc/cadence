import { playBook } from './playBook';
import { trackDuration } from '../player/playerFormat';
import { usePlayer } from '../player/usePlayer';
import type { Book } from './groupBooks';

/** The chapter/part list for a multi-file book: each row plays the whole book
 * starting at that part, so next/prev continue through the rest. The currently
 * playing part is marked. Single-file books render nothing (nothing to list). */
export function BookParts({ book }: { book: Book }) {
  const player = usePlayer();
  if (book.parts.length <= 1) return null;
  return (
    <section data-testid="book-parts">
      <h2 className="cad-kicker">Chapters</h2>
      {book.parts.map((part, i) => {
        const isCurrent = part.Id === player.current?.Id;
        return (
          <button
            key={part.Id}
            type="button"
            className={isCurrent ? 'track-row track-row--current' : 'track-row'}
            data-testid="book-part"
            onClick={() => playBook(player, book, i)}
          >
            <span className="track-row__num">{part.IndexNumber ?? i + 1}</span>
            <span className="track-row__meta">
              <span className="track-row__title">{part.Name}</span>
              {trackDuration(part.RunTimeTicks) && (
                <span className="track-row__artist">{trackDuration(part.RunTimeTicks)}</span>
              )}
            </span>
          </button>
        );
      })}
    </section>
  );
}
