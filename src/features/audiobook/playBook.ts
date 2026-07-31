import { setPlayContext } from '../player/playContext';
import type { Book } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The slice of the player we need to start a book — kept minimal so both the
 * row and the detail page (and their tests) can pass a stub. */
interface BookPlayer {
  playQueue: (tracks: JellyfinItem[], index: number) => void;
}

/** Play a whole book as a queue starting at `index` (default 0), recording the
 * "Playing from …" context so the full player links back to the Audiobooks tab
 * and next/prev walk the book's parts. Shared by BookRow and BookDetail. */
export function playBook(player: BookPlayer, book: Book, index = 0): void {
  setPlayContext({
    kind: 'audiobook',
    label: book.title,
    path: '/audiobooks',
    tracks: book.parts,
  });
  player.playQueue(book.parts, index);
}
