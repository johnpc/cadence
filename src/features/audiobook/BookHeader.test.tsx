import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BookHeader } from './BookHeader';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { Book } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const SEC = 10_000_000;
const part = (over: Partial<JellyfinItem>): JellyfinItem =>
  ({ Id: 'p', Name: 'Book', Type: 'AudioBook', AlbumArtist: 'Author', ...over }) as JellyfinItem;

const unstarted: Book = {
  id: 'b',
  title: 'Dune',
  book: part({}),
  parts: [part({ Id: 'p0' }), part({ Id: 'p1' })],
};

describe('BookHeader', () => {
  it('shows title, author and a part count', () => {
    renderWithProviders(<BookHeader book={unstarted} />, { player: stubPlayer() });
    expect(screen.getByTestId('book-title')).toHaveTextContent('Dune');
    expect(screen.getByText('Author')).toBeInTheDocument();
    expect(screen.getByTestId('book-progress-label')).toHaveTextContent('2 parts');
  });

  it('offers Play (from the start) for an unstarted book', async () => {
    const playQueue = vi.fn();
    renderWithProviders(<BookHeader book={unstarted} />, { player: stubPlayer({ playQueue }) });
    expect(screen.getByTestId('book-play')).toHaveTextContent('Play');
    await userEvent.click(screen.getByTestId('book-play'));
    expect(playQueue).toHaveBeenCalledWith(unstarted.parts, 0);
  });

  it('offers a favorite (heart) control', () => {
    renderWithProviders(<BookHeader book={unstarted} />, { player: stubPlayer() });
    expect(screen.getByTestId('like-button')).toBeInTheDocument();
  });

  it('offers Resume (jumping to the first unfinished part) for a started book', async () => {
    const playQueue = vi.fn();
    const started: Book = {
      id: 'b',
      title: 'Dune',
      book: part({}),
      parts: [
        part({ Id: 'p0', RunTimeTicks: 100 * SEC, UserData: { Played: true } }),
        part({ Id: 'p1', RunTimeTicks: 100 * SEC, UserData: { PlaybackPositionTicks: 20 * SEC } }),
      ],
    };
    renderWithProviders(<BookHeader book={started} />, { player: stubPlayer({ playQueue }) });
    expect(screen.getByTestId('book-play')).toHaveTextContent('Resume');
    await userEvent.click(screen.getByTestId('book-play'));
    expect(playQueue).toHaveBeenCalledWith(started.parts, 1); // first unfinished part
  });
});
