import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const prefetch = vi.fn();
vi.mock('../home/usePrefetchItem', () => ({ usePrefetchItem: () => prefetch }));
import { LibraryRowItem } from './LibraryRowItem';
import type { LibraryRow } from './libraryRows';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const playlist: JellyfinItem = { Id: 'pl1', Name: 'My Mix', Type: 'Playlist' };
const row: LibraryRow = {
  id: 'pl1',
  name: 'My Mix',
  subtitle: 'Playlist',
  to: '/playlist/pl1',
  round: false,
  item: playlist,
};

function renderRow(r: LibraryRow) {
  return render(
    <MemoryRouter>
      <LibraryRowItem row={r} />
    </MemoryRouter>,
  );
}

describe('LibraryRowItem', () => {
  it('links to the row target', () => {
    renderRow(row);
    expect(screen.getByTestId('library-row')).toHaveAttribute('href', '/playlist/pl1');
  });

  it('warms the detail queries on hover', () => {
    renderRow(row);
    fireEvent.mouseEnter(screen.getByTestId('library-row'));
    expect(prefetch).toHaveBeenCalledWith(playlist);
  });

  it('applies the grid card class in grid view', () => {
    render(
      <MemoryRouter>
        <LibraryRowItem row={row} view="grid" />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('library-row')).toHaveClass('library-row--grid');
  });

  it('does not prefetch the synthetic Liked Songs row (no backing item)', () => {
    prefetch.mockClear();
    renderRow({
      id: 'liked',
      name: 'Liked Songs',
      subtitle: 'Playlist • 3 songs',
      to: '/liked',
      round: false,
      item: null,
      liked: true,
    });
    fireEvent.mouseEnter(screen.getByTestId('library-row'));
    expect(prefetch).not.toHaveBeenCalled();
  });
});
