import { act, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// jsdom lacks IntersectionObserver (used by the progressive list); stub a no-op.
beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return [];
      }
      root = null;
      rootMargin = '';
      thresholds = [];
    },
  );
});

/** IonSearchbar wraps a native input jsdom can't drive via userEvent; fire its
 * `ionInput` CustomEvent directly (the documented pattern for this codebase). */
function typeSearch(value: string) {
  const bar = screen.getByTestId('playlist-search');
  act(() => {
    bar.dispatchEvent(new CustomEvent('ionInput', { detail: { value } }));
  });
}

/** Fire IonSelect's `ionChange` to change the sort (jsdom can't open its popover). */
function chooseSort(value: string) {
  const sel = screen.getByTestId('playlist-sort');
  act(() => {
    sel.dispatchEvent(new CustomEvent('ionChange', { detail: { value } }));
  });
}

vi.mock('../../lib/jellyfinPlaylists', () => ({
  removeFromPlaylist: vi.fn(),
  movePlaylistItem: vi.fn(),
}));
vi.mock('../../lib/jellyfinItems', () => ({ addFavorite: vi.fn(), removeFavorite: vi.fn() }));
import { PlaylistTracks } from './PlaylistTracks';
import { PlayerContext } from '../player/PlayerContext';
import { stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Build N tracks so the filter box (which shows only for >8) appears. */
function makeTracks(n: number): JellyfinItem[] {
  return Array.from({ length: n }, (_, i) => ({
    Id: String(i),
    PlaylistItemId: `e${i}`,
    Name: i === 0 ? 'Karma Police' : `Song ${i}`,
    Type: 'Audio',
    Artists: [i === 0 ? 'Radiohead' : 'Filler'],
  }));
}

function renderTracks(tracks: JellyfinItem[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <PlayerContext.Provider value={stubPlayer()}>
        <MemoryRouter>
          <PlaylistTracks playlistId="p1" tracks={tracks} />
        </MemoryRouter>
      </PlayerContext.Provider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

describe('PlaylistTracks', () => {
  it('hides the filter box for short playlists', () => {
    renderTracks(makeTracks(3));
    expect(screen.queryByTestId('playlist-search')).not.toBeInTheDocument();
  });

  it('virtualizes a long playlist — renders a window + a load-more sentinel', () => {
    renderTracks(makeTracks(120));
    // Only the initial window (50) renders, not all 120.
    expect(screen.getAllByTestId('track-row').length).toBeLessThan(120);
    expect(screen.getAllByTestId('track-row').length).toBeGreaterThan(0);
    expect(screen.getByTestId('playlist-load-more')).toBeInTheDocument();
  });

  it('filters the visible tracks by the query', () => {
    renderTracks(makeTracks(12));
    expect(screen.getByTestId('playlist-search')).toBeInTheDocument();
    typeSearch('karma');
    expect(screen.getByText('Karma Police')).toBeInTheDocument();
    expect(screen.queryByText('Song 5')).not.toBeInTheDocument();
  });

  it('shows a no-matches message when nothing matches', () => {
    renderTracks(makeTracks(12));
    typeSearch('zzzznope');
    expect(screen.getByTestId('playlist-no-matches')).toBeInTheDocument();
  });

  it('offers reorder in custom order but hides it once sorted by title', () => {
    renderTracks(makeTracks(12));
    // Custom order (default): reorder controls present.
    expect(screen.getAllByTestId('track-row-up').length).toBeGreaterThan(0);
    chooseSort('title');
    // Sorting a re-sorted view would break index mapping, so reorder is hidden.
    expect(screen.queryByTestId('track-row-up')).not.toBeInTheDocument();
  });
});
