import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BookRow } from './BookRow';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { Book } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const part = (id: string, name: string): JellyfinItem =>
  ({ Id: id, Name: name, Type: 'AudioBook', AlbumArtist: 'Author' }) as JellyfinItem;

const single: Book = {
  id: 's',
  book: part('s', 'Blade Runner'),
  title: 'Blade Runner',
  parts: [part('s', 'Blade Runner')],
};
const multi: Book = {
  id: 'm1',
  book: part('m1', 'The Little Prince'),
  title: 'The Little Prince',
  parts: [part('m1', 'Ch 1'), part('m2', 'Ch 2'), part('m3', 'Ch 3')],
};

describe('BookRow', () => {
  it('shows the title and author', () => {
    renderWithProviders(<BookRow book={single} />, { player: stubPlayer() });
    expect(screen.getByText('Blade Runner')).toBeInTheDocument();
    expect(screen.getByText('Author')).toBeInTheDocument();
  });

  it('shows a part count for multi-file books', () => {
    renderWithProviders(<BookRow book={multi} />, { player: stubPlayer() });
    expect(screen.getByText(/3 parts/)).toBeInTheDocument();
  });

  it('plays all parts as a queue when tapped', async () => {
    const playQueue = vi.fn();
    renderWithProviders(<BookRow book={multi} />, { player: stubPlayer({ playQueue }) });
    await userEvent.click(screen.getByTestId('book-row-play'));
    expect(playQueue).toHaveBeenCalledWith(multi.parts, 0);
  });

  it('marks the row current when a part is playing', () => {
    renderWithProviders(<BookRow book={multi} />, {
      player: stubPlayer({ current: multi.parts[1] }),
    });
    expect(screen.getByTestId('book-row')).toHaveClass('track-row--current');
  });
});
