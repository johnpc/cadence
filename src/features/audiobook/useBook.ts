import { useMemo } from 'react';
import { groupBooks, type Book } from './groupBooks';
import { useAudiobookLibrary } from './useAudiobookLibrary';
import { resolveBookRef } from './bookLink';

/** Resolve a single book from the audiobook library by any ref the route
 * accepts — the group id (first part's Id), any part's id, a readable
 * `<slug>-<id8>`, or a bare slug (see bookLink.resolveBookRef). Reuses useAudiobookLibrary so the detail page shares the
 * same fast plugin path / cache as the list (opening a book off the list is a
 * cache hit — no extra fetch). Returns the book plus the list's load state so
 * the page can show loading / error / not-found. */
export function useBook(id: string): {
  book: Book | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { books, isLoading, isError, refetch } = useAudiobookLibrary();
  const book = useMemo(() => resolveBookRef(id, groupBooks(books)), [books, id]);
  return { book, isLoading, isError, refetch };
}
