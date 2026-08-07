import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./useBook', () => ({ useBook: vi.fn() }));
// BookChapters (single-file books) fetches embedded chapters — stub it to none.
vi.mock('./audiobookApi', () => ({ fetchChapters: vi.fn().mockResolvedValue([]) }));
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useParams: () => ({ id: 'b' }) };
});
import { useBook } from './useBook';
import { BookDetail } from './BookDetail';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { Book } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const book: Book = {
  id: 'b',
  title: 'Dune',
  book: {
    Id: 'b',
    Name: 'Dune',
    Type: 'AudioBook',
    AlbumArtist: 'Frank Herbert',
    Overview: 'Spice.',
    Genres: ['Sci-Fi'],
    ProductionYear: 1965,
  } as JellyfinItem,
  parts: [{ Id: 'b', Name: 'Dune', Type: 'AudioBook' } as JellyfinItem],
};

const stub = (over: Partial<ReturnType<typeof useBook>>) =>
  vi
    .mocked(useBook)
    .mockReturnValue({ book: null, isLoading: false, isError: false, refetch: vi.fn(), ...over });

afterEach(() => {
  vi.resetAllMocks();
});

describe('BookDetail', () => {
  it('renders the book header, genres, about, and facts when loaded', () => {
    stub({ book });
    renderWithProviders(<BookDetail />, { player: stubPlayer() });
    expect(screen.getByTestId('book-detail')).toBeInTheDocument();
    expect(screen.getByTestId('book-title')).toHaveTextContent('Dune');
    expect(screen.getByTestId('book-about')).toHaveTextContent('Spice.');
    expect(screen.getByTestId('genre-chips')).toHaveTextContent('Sci-Fi');
    expect(screen.getByTestId('book-facts')).toHaveTextContent('1965');
  });

  it('shows a not-found state when the book is missing from the library', () => {
    stub({ book: null });
    renderWithProviders(<BookDetail />, { player: stubPlayer() });
    expect(screen.getByText('Book not found')).toBeInTheDocument();
  });
});
