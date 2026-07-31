import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BookParts } from './BookParts';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { Book } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const part = (id: string, name: string, n: number): JellyfinItem =>
  ({ Id: id, Name: name, Type: 'AudioBook', IndexNumber: n }) as JellyfinItem;

const multi: Book = {
  id: 'm',
  title: 'Meditations',
  book: part('m0', 'Ch 1', 1),
  parts: [part('m0', 'Ch 1', 1), part('m1', 'Ch 2', 2), part('m2', 'Ch 3', 3)],
};

describe('BookParts', () => {
  it('renders nothing for a single-file book', () => {
    const single: Book = {
      id: 's',
      title: 'Solo',
      book: part('s', 'Solo', 1),
      parts: [part('s', 'Solo', 1)],
    };
    const { container } = renderWithProviders(<BookParts book={single} />, {
      player: stubPlayer(),
    });
    expect(container.querySelector('[data-testid="book-parts"]')).toBeNull();
  });

  it('lists every part of a multi-file book', () => {
    renderWithProviders(<BookParts book={multi} />, { player: stubPlayer() });
    expect(screen.getAllByTestId('book-part')).toHaveLength(3);
  });

  it('plays the book from the tapped part', async () => {
    const playQueue = vi.fn();
    renderWithProviders(<BookParts book={multi} />, { player: stubPlayer({ playQueue }) });
    await userEvent.click(screen.getAllByTestId('book-part')[2]);
    expect(playQueue).toHaveBeenCalledWith(multi.parts, 2);
  });

  it('marks the currently-playing part', () => {
    renderWithProviders(<BookParts book={multi} />, {
      player: stubPlayer({ current: multi.parts[1] }),
    });
    expect(screen.getAllByTestId('book-part')[1]).toHaveClass('track-row--current');
  });
});
