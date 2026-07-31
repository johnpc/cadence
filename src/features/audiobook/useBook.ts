import { useMemo } from 'react';
import { groupBooks, type Book } from './groupBooks';
import { useAudiobookLibrary } from './useAudiobookLibrary';

/** Resolve a single book (by its group id — the first part's Id) from the
 * audiobook library. Reuses useAudiobookLibrary so the detail page shares the
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
  const book = useMemo(() => groupBooks(books).find((b) => b.id === id) ?? null, [books, id]);
  return { book, isLoading, isError, refetch };
}
