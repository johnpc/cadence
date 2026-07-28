import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./useAudiobookLibrary', () => ({ useAudiobookLibrary: vi.fn() }));
import { useAudiobookLibrary } from './useAudiobookLibrary';
import { Audiobooks } from './Audiobooks';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const book = (id: string): JellyfinItem =>
  ({ Id: id, Name: id, Type: 'AudioBook', Album: id }) as JellyfinItem;

const stub = (over: Partial<ReturnType<typeof useAudiobookLibrary>>) =>
  vi.mocked(useAudiobookLibrary).mockReturnValue({
    books: [],
    resumable: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...over,
  });

afterEach(() => {
  vi.resetAllMocks();
});

const render = () => renderWithProviders(<Audiobooks />, { player: stubPlayer() });

describe('Audiobooks', () => {
  it('shows an empty state when there are no books', () => {
    stub({ books: [] });
    render();
    expect(screen.getByText('No audiobooks')).toBeInTheDocument();
  });

  it('lists all books as grouped book rows', () => {
    stub({ books: [book('Dune'), book('Sapiens')] });
    render();
    expect(screen.getAllByTestId('book-row')).toHaveLength(2);
  });

  it('collapses a multi-file book into a single row', () => {
    const parts = [
      { Id: 'p1', Name: 'Ch 1', Type: 'AudioBook', Album: 'Meditations', IndexNumber: 1 },
      { Id: 'p2', Name: 'Ch 2', Type: 'AudioBook', Album: 'Meditations', IndexNumber: 2 },
    ] as JellyfinItem[];
    stub({ books: parts });
    render();
    expect(screen.getAllByTestId('book-row')).toHaveLength(1);
    expect(screen.getByText(/2 parts/)).toBeInTheDocument();
  });

  it('shows a Continue listening section when there are resumable books', () => {
    stub({ books: [book('Dune')], resumable: [book('Dune')] });
    render();
    expect(screen.getByTestId('audiobooks-continue')).toBeInTheDocument();
  });

  it('omits Continue listening when nothing is in progress', () => {
    stub({ books: [book('Dune')], resumable: [] });
    render();
    expect(screen.queryByTestId('audiobooks-continue')).not.toBeInTheDocument();
  });
});
