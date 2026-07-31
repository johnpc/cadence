import type { Book } from './groupBooks';

/** How the audiobook list is ordered:
 * - 'alpha' (default): A–Z by title.
 * - 'added': most recently ADDED to the server first (book's DateCreated).
 * - 'played': most recently PLAYED first (book's UserData.LastPlayedDate);
 *   never-played books keep their server order below the played ones. */
export type BookSort = 'alpha' | 'added' | 'played';

/** The sort options shown in the Audiobooks sort dropdown, with human labels.
 * Mirrors the Your Library sort control (LIBRARY_SORTS). */
export const BOOK_SORTS: { value: BookSort; label: string }[] = [
  { value: 'alpha', label: 'A–Z' },
  { value: 'added', label: 'Recently added' },
  { value: 'played', label: 'Recently played' },
];

/** The book's sort timestamp for a date sort: the MAX across its parts (a
 * multi-file book is "added"/"played" when its most recent part was), or 0 when
 * absent so keyless books fall to the end via the stable tiebreak. */
function bookDate(book: Book, sort: 'added' | 'played'): number {
  let max = 0;
  for (const part of book.parts) {
    const raw = sort === 'added' ? part.DateCreated : part.UserData?.LastPlayedDate;
    const t = raw ? Date.parse(raw) : NaN;
    if (!Number.isNaN(t) && t > max) max = t;
  }
  return max;
}

/**
 * Order grouped books by the chosen sort. 'alpha' is a plain title compare;
 * every date sort is a STABLE sort by a numeric key desc, so ties and keyless
 * books keep their incoming (server SortName) order. Pure + unit-testable.
 */
export function sortBooks(books: Book[], sort: BookSort): Book[] {
  if (sort === 'alpha') {
    return [...books].sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
    );
  }
  return books
    .map((b, i) => ({ b, i }))
    .sort((x, y) => bookDate(y.b, sort) - bookDate(x.b, sort) || x.i - y.i)
    .map((e) => e.b);
}
