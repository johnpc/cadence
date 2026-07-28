import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./audiobookApi', () => ({ fetchChapters: vi.fn() }));
import { fetchChapters } from './audiobookApi';
import { AudiobookProgress } from './AudiobookProgress';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const book = { Id: 'b1', Name: 'Book', Type: 'AudioBook' } as JellyfinItem;
const song = { Id: 's1', Name: 'Song', Type: 'Audio' } as JellyfinItem;

afterEach(() => {
  vi.resetAllMocks();
});

function render(item: JellyfinItem, position: number, duration: number) {
  return renderWithProviders(<AudiobookProgress />, {
    player: stubPlayer({ current: item }),
    progress: { position, duration },
  });
}

describe('AudiobookProgress', () => {
  it('renders nothing for a music track', async () => {
    vi.mocked(fetchChapters).mockResolvedValue([]);
    const { container } = render(song, 10, 200);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows time left in the book', async () => {
    vi.mocked(fetchChapters).mockResolvedValue([]);
    render(book, 300, 3600);
    expect(await screen.findByTestId('audiobook-book-line')).toHaveTextContent('55m left in book');
  });

  it('shows the current chapter name and time left in it', async () => {
    vi.mocked(fetchChapters).mockResolvedValue([
      { name: 'One', start: 0 },
      { name: 'Two', start: 600 },
    ]);
    render(book, 300, 3600);
    const line = await screen.findByTestId('audiobook-chapter-line');
    expect(line).toHaveTextContent('One');
    expect(line).toHaveTextContent('5m left');
  });
});
