import { statusOf, type ReadAlongIndex } from '../readalong/readAlongLibrary';
import type { Book } from './groupBooks';
import type { BookFilter } from './bookFilterStore';

/** The filter actually in force: 'readalong' only counts while its chip is
 * shown (a bridge with at least one ready book) — a stored choice from a
 * server that no longer has read-along must not hide the whole library. */
export function effectiveBookFilter(stored: BookFilter, index: ReadAlongIndex): BookFilter {
  return index.ready > 0 ? stored : 'all';
}

export function applyBookFilter(books: Book[], filter: BookFilter, index: ReadAlongIndex): Book[] {
  if (filter === 'all') return books;
  return books.filter((b) => statusOf(index, b) === 'ready');
}
