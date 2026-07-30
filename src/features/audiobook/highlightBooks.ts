import type { Book } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Resolve raw highlight items (from the IsResumable / IsFavorite queries, which
 * return individual part-items like "Preface" or "Calypso") to the GROUPED books
 * they belong to, so the "Continue listening & favorites" section shows real
 * book rows — matching the main list — instead of orphan chapter fragments.
 *
 * Each highlight part is matched to the book whose `parts` contain it (by id);
 * books are emitted in highlight order, deduped. Highlights that don't map to any
 * grouped book (e.g. a stale id after a library change) are dropped.
 */
export function highlightBooks(highlights: JellyfinItem[], grouped: Book[]): Book[] {
  const bookByPartId = new Map<string, Book>();
  for (const book of grouped) {
    for (const part of book.parts) bookByPartId.set(part.Id, book);
  }
  const out: Book[] = [];
  const seen = new Set<string>();
  for (const h of highlights) {
    const book = bookByPartId.get(h.Id);
    if (book && !seen.has(book.id)) {
      seen.add(book.id);
      out.push(book);
    }
  }
  return out;
}
