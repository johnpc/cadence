import { formatTime } from '../player/playerFormat';
import { usePlayer } from '../player/usePlayer';
import { usePlayerProgress } from '../player/PlayerProgressContext';
import { useChapters } from './useChapters';
import { chapterIndexAt } from './chapterAt';
import { playChapter } from './playChapter';
import type { Book } from './groupBooks';

/** The embedded-chapter list for a SINGLE-FILE audiobook (one m4b with chapter
 * markers). Multi-file books list their parts via BookParts instead; this renders
 * nothing for them, and nothing when the file has no chapters. Tapping a chapter
 * plays the book from that timestamp; the chapter currently playing is marked. */
export function BookChapters({ book }: { book: Book }) {
  const player = usePlayer();
  const { position } = usePlayerProgress();
  const part = book.parts[0];
  const isCurrent = player.current?.Id === part.Id;
  const { chapters } = useChapters(book.parts.length === 1 ? part : null);
  if (book.parts.length !== 1 || chapters.length === 0) return null;
  const active = isCurrent ? chapterIndexAt(chapters, position) : -1;

  return (
    <section data-testid="book-chapters">
      <h2 className="cad-kicker">Chapters</h2>
      {chapters.map((chapter, i) => (
        <button
          key={i}
          type="button"
          className={i === active ? 'track-row track-row--current' : 'track-row'}
          data-testid="book-chapter"
          onClick={() => playChapter(player, book, chapter.start)}
        >
          <span className="track-row__num">{i + 1}</span>
          <span className="track-row__meta">
            <span className="track-row__title">{chapter.name}</span>
            <span className="track-row__artist">{formatTime(chapter.start)}</span>
          </span>
        </button>
      ))}
    </section>
  );
}
