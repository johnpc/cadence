import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./useAudiobookLibrary', () => ({ useAudiobookLibrary: vi.fn() }));
import { useAudiobookLibrary } from './useAudiobookLibrary';
import { Audiobooks } from './Audiobooks';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const book = (id: string): JellyfinItem =>
  ({ Id: id, Name: id, Type: 'AudioBook' }) as JellyfinItem;

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

  it('lists all books', () => {
    stub({ books: [book('Dune'), book('Sapiens')] });
    render();
    expect(screen.getAllByTestId('track-row')).toHaveLength(2);
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
