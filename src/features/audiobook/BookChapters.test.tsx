import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./audiobookApi', () => ({ fetchChapters: vi.fn() }));
import { fetchChapters } from './audiobookApi';
import { BookChapters } from './BookChapters';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { Book } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const part = (id: string) => ({ Id: id, Name: 'Book', Type: 'AudioBook' }) as JellyfinItem;
const single: Book = { id: 'b', title: 'Book', book: part('b'), parts: [part('b')] };
const multi: Book = { id: 'b', title: 'Book', book: part('b'), parts: [part('b'), part('c')] };

afterEach(() => {
  vi.resetAllMocks();
});

describe('BookChapters', () => {
  it('is collapsed by default and expands on the header toggle, with human timestamps', async () => {
    vi.mocked(fetchChapters).mockResolvedValue([
      { name: 'One', start: 0 },
      { name: 'Two', start: 5430 }, // 1h30m30s
    ]);
    const playQueue = vi.fn();
    renderWithProviders(<BookChapters book={single} />, { player: stubPlayer({ playQueue }) });

    // Collapsed: the toggle shows the count, no rows yet.
    const toggle = await screen.findByTestId('book-chapters-toggle');
    expect(toggle).toHaveTextContent('2 chapters');
    expect(screen.queryAllByTestId('book-chapter')).toHaveLength(0);

    await userEvent.click(toggle);
    const rows = screen.getAllByTestId('book-chapter');
    expect(rows).toHaveLength(2);
    expect(rows[1]).toHaveTextContent('Two');
    expect(rows[1]).toHaveTextContent('1h30m'); // not "90:30"

    await userEvent.click(rows[1]);
    expect(playQueue).toHaveBeenCalledWith(single.parts, 0);

    // Collapses back.
    await userEvent.click(toggle);
    expect(screen.queryAllByTestId('book-chapter')).toHaveLength(0);
  });

  it('marks the currently-playing chapter (once expanded)', async () => {
    vi.mocked(fetchChapters).mockResolvedValue([
      { name: 'One', start: 0 },
      { name: 'Two', start: 600 },
    ]);
    renderWithProviders(<BookChapters book={single} />, {
      player: stubPlayer({ current: part('b') }),
      progress: { position: 700, duration: 3600 },
    });
    await userEvent.click(await screen.findByTestId('book-chapters-toggle'));
    const rows = screen.getAllByTestId('book-chapter');
    expect(rows[1].className).toContain('track-row--current');
    expect(rows[0].className).not.toContain('track-row--current');
  });

  it('renders nothing for a multi-file book (BookParts handles those)', () => {
    vi.mocked(fetchChapters).mockResolvedValue([{ name: 'One', start: 0 }]);
    const { container } = renderWithProviders(<BookChapters book={multi} />, {
      player: stubPlayer(),
    });
    expect(container).toBeEmptyDOMElement();
    // never fetches chapters for a multi-file book
    expect(fetchChapters).not.toHaveBeenCalled();
  });

  it('renders nothing when the file has no chapter markers', async () => {
    vi.mocked(fetchChapters).mockResolvedValue([]);
    const { container } = renderWithProviders(<BookChapters book={single} />, {
      player: stubPlayer(),
    });
    // wait a tick for the query to settle
    await Promise.resolve();
    expect(container).toBeEmptyDOMElement();
  });
});
