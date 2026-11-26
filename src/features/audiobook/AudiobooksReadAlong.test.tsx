import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./useAudiobookLibrary', () => ({ useAudiobookLibrary: vi.fn() }));
vi.mock('../readalong/storytellerApi', () => ({ getReadAlongLibrary: vi.fn() }));
vi.mock('../../lib/runtimeConfig', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/runtimeConfig')>()),
  storytellerEnabled: () => true,
}));

import { useAudiobookLibrary } from './useAudiobookLibrary';
import { getReadAlongLibrary } from '../readalong/storytellerApi';
import { Audiobooks } from './Audiobooks';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { ReadAlongStatus } from '../readalong/storytellerApi';

const book = (id: string): JellyfinItem =>
  ({ Id: id, Name: id, Type: 'AudioBook', Album: id }) as JellyfinItem;

function setup(statuses: Record<string, ReadAlongStatus>) {
  vi.mocked(useAudiobookLibrary).mockReturnValue({
    books: [book('Circe'), book('Dune'), book('Hogfather')],
    highlights: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });
  vi.mocked(getReadAlongLibrary).mockResolvedValue({
    Status: 'ok',
    Books: Object.entries(statuses).map(([ItemId, Status]) => ({ ItemId, Status })),
  });
  return renderWithProviders(<Audiobooks />, { player: stubPlayer() });
}

const titles = () => screen.getAllByTestId('book-row').map((r) => r.textContent ?? '');

afterEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

describe('Audiobooks read-along', () => {
  it('badges ready and aligning books', async () => {
    setup({ Circe: 'ready', Dune: 'aligning', Hogfather: 'empty' });
    const badges = await screen.findAllByTestId('readalong-badge');
    expect(badges.map((b) => b.textContent)).toEqual(['Read along', 'Aligning…']);
  });

  it('the Read along chip narrows the list to ready books and is remembered', async () => {
    setup({ Circe: 'ready', Dune: 'aligning', Hogfather: 'ready' });
    await userEvent.click(await screen.findByTestId('book-filter-readalong'));
    expect(screen.getByTestId('book-filter-readalong')).toHaveAttribute('aria-pressed', 'true');
    expect(titles()).toHaveLength(2);
    expect(titles().join()).not.toContain('Dune');
    expect(screen.getByText('Ready to read along')).toBeInTheDocument();
    expect(localStorage.getItem('cadence.books.filter')).toBe('readalong');
    await userEvent.click(screen.getByTestId('book-filter-all'));
    expect(titles()).toHaveLength(3);
  });

  it('hides the chips while no book is ready, even with a remembered filter', async () => {
    localStorage.setItem('cadence.books.filter', 'readalong');
    setup({ Dune: 'aligning' });
    await screen.findByTestId('readalong-badge');
    expect(screen.queryByTestId('book-filter-readalong')).not.toBeInTheDocument();
    expect(titles()).toHaveLength(3);
  });

  it('says so when the ready books are not in this library', async () => {
    localStorage.setItem('cadence.books.filter', 'readalong');
    setup({ elsewhere: 'ready' });
    expect(await screen.findByText('No books ready to read along yet')).toBeInTheDocument();
  });
});
