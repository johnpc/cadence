import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinDiscover', () => ({
  getLatestAlbums: vi.fn(),
  getSuggestedSongs: vi.fn(),
  getRecentlyPlayed: vi.fn(),
}));
vi.mock('../../lib/jellyfinItems', () => ({ getItem: vi.fn() }));
import { getRecentlyPlayed } from '../../lib/jellyfinDiscover';
import { getItem } from '../../lib/jellyfinItems';
import { touchRecentPlay } from '../library/recentPlays';
import { History } from './History';
import { PlayerContext } from '../player/PlayerContext';
import { stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const songs: JellyfinItem[] = [
  { Id: 't1', Name: 'Last Played', Type: 'Audio', Artists: ['A'] },
  { Id: 't2', Name: 'Earlier Song', Type: 'Audio' },
];

function renderHistory() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <PlayerContext.Provider value={stubPlayer()}>
        <MemoryRouter initialEntries={['/history']}>
          <History />
          <Route
            path="*"
            render={({ location }) => <span data-testid="loc">{location.pathname}</span>}
          />
        </MemoryRouter>
      </PlayerContext.Provider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
});

describe('History', () => {
  it('lists the recently-played tracks and asks for a deep history', async () => {
    vi.mocked(getRecentlyPlayed).mockResolvedValue(songs);
    renderHistory();
    expect(await screen.findByText('Last Played')).toBeInTheDocument();
    expect(screen.getByText('Earlier Song')).toBeInTheDocument();
    expect(getRecentlyPlayed).toHaveBeenCalledWith(100);
  });

  it('shows an empty state when nothing has been played', async () => {
    vi.mocked(getRecentlyPlayed).mockResolvedValue([]);
    renderHistory();
    await waitFor(() => expect(screen.getByTestId('load-empty')).toBeInTheDocument());
  });

  it('also shows recently-played collections (playlists/artists) and opens them', async () => {
    vi.mocked(getRecentlyPlayed).mockResolvedValue(songs);
    // Seed the local recent-plays store with a played playlist; useJumpBackIn
    // hydrates it via getItem into the collections shelf.
    touchRecentPlay('pl1', 1000);
    vi.mocked(getItem).mockResolvedValue({ Id: 'pl1', Name: 'My Mix', Type: 'Playlist' });
    renderHistory();
    expect(await screen.findByText('My Mix')).toBeInTheDocument();
    // The songs section still renders alongside it.
    expect(screen.getByTestId('history-songs-title')).toBeInTheDocument();
    // Tapping the collection card opens its detail page (covers the open handler).
    const { default: userEvent } = await import('@testing-library/user-event');
    await userEvent.click(screen.getByTestId('album-card-open'));
    expect(screen.getByTestId('loc')).toHaveTextContent('/playlist/pl1');
  });
});
