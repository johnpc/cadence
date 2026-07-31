import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./useAudiobookLibrary', () => ({ useAudiobookLibrary: vi.fn() }));
import { useAudiobookLibrary } from './useAudiobookLibrary';
import { useBook } from './useBook';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const item = (id: string, album: string): JellyfinItem =>
  ({ Id: id, Name: id, Type: 'AudioBook', Album: album }) as JellyfinItem;

const stub = (books: JellyfinItem[]) =>
  vi.mocked(useAudiobookLibrary).mockReturnValue({
    books,
    highlights: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });

afterEach(() => {
  vi.resetAllMocks();
});

describe('useBook', () => {
  it('resolves the grouped book whose id matches (first part id)', () => {
    // Two files of one book (shared Album) group into one book keyed by the first id.
    stub([item('p0', 'Dune'), item('p1', 'Dune'), item('x', 'Other')]);
    const { result } = renderHook(() => useBook('p0'));
    expect(result.current.book?.title).toBe('Dune');
    expect(result.current.book?.parts).toHaveLength(2);
  });

  it('returns null when no book matches the id', () => {
    stub([item('p0', 'Dune')]);
    const { result } = renderHook(() => useBook('missing'));
    expect(result.current.book).toBeNull();
  });

  it('passes through the library load state', () => {
    vi.mocked(useAudiobookLibrary).mockReturnValue({
      books: [],
      highlights: [],
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    });
    const { result } = renderHook(() => useBook('p0'));
    expect(result.current.isLoading).toBe(true);
  });
});
