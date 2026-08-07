import { setPendingSeek } from '../player/pendingSeek';
import { playBook } from './playBook';
import type { Book } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The player slice needed to start a book at a chapter (see playBook). */
interface BookPlayer {
  playQueue: (tracks: JellyfinItem[], index: number) => void;
  current: JellyfinItem | null;
  seek: (seconds: number) => void;
}

/**
 * Play a single-file audiobook at an embedded chapter's timestamp. If the book's
 * file is already the current track, just seek (it's loaded). Otherwise start the
 * book and register a one-shot pending seek so useAudiobookResume jumps to the
 * chapter once the file reports metadata. The book's single part is `book.parts[0]`.
 */
export function playChapter(player: BookPlayer, book: Book, seconds: number): void {
  const part = book.parts[0];
  if (player.current?.Id === part.Id) {
    player.seek(seconds);
    return;
  }
  setPendingSeek(part.Id, seconds);
  playBook(player, book, 0);
}
