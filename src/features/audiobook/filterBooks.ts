import type { Book } from './groupBooks';

/**
 * Filter grouped books by a free-text query, matching the book title or author
 * (case-insensitive). An empty query returns the list unchanged. Pure so the
 * audiobook search box stays unit-testable.
 */
export function filterBooks(books: Book[], query: string): Book[] {
  const q = query.trim().toLowerCase();
  if (!q) return books;
  return books.filter((b) => {
    const author = b.book.AlbumArtist ?? b.book.Artists?.[0] ?? '';
    return `${b.book.Name} ${author}`.toLowerCase().includes(q);
  });
}
