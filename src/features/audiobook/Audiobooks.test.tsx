import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./useAudiobookLibrary', () => ({ useAudiobookLibrary: vi.fn() }));
// IonSearchbar → a plain input so we can type into it in jsdom.
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonSearchbar: ({
      value,
      onIonInput,
      ...rest
    }: {
      value?: string;
      onIonInput?: (e: { detail: { value: string } }) => void;
      [k: string]: unknown;
    }) => (
      <input
        {...(rest as Record<string, unknown>)}
        value={value ?? ''}
        onChange={(e) => onIonInput?.({ detail: { value: e.target.value } })}
      />
    ),
  };
});

import { useAudiobookLibrary } from './useAudiobookLibrary';
import { Audiobooks } from './Audiobooks';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const book = (id: string): JellyfinItem =>
  ({ Id: id, Name: id, Type: 'AudioBook', Album: id }) as JellyfinItem;

const stub = (over: Partial<ReturnType<typeof useAudiobookLibrary>>) =>
  vi.mocked(useAudiobookLibrary).mockReturnValue({
    books: [],
    highlights: [],
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

  it('shows a highlights section for in-progress/favorite books', () => {
    stub({ books: [book('Dune')], highlights: [book('Dune')] });
    render();
    expect(screen.getByTestId('audiobooks-highlights')).toBeInTheDocument();
  });

  it('omits highlights when there are none', () => {
    stub({ books: [book('Dune')], highlights: [] });
    render();
    expect(screen.queryByTestId('audiobooks-highlights')).not.toBeInTheDocument();
  });

  it('filters the list by the search query and hides highlights while searching', async () => {
    stub({ books: [book('Dune'), book('Sapiens')], highlights: [book('Dune')] });
    render();
    await userEvent.type(screen.getByTestId('audiobook-search'), 'dune');
    expect(screen.getAllByTestId('book-row')).toHaveLength(1);
    expect(screen.queryByTestId('audiobooks-highlights')).not.toBeInTheDocument();
  });

  it('shows a no-matches note when the search finds nothing', async () => {
    stub({ books: [book('Dune')] });
    render();
    await userEvent.type(screen.getByTestId('audiobook-search'), 'zzz');
    expect(screen.getByTestId('audiobook-no-matches')).toBeInTheDocument();
  });
});
