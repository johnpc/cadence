import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/navidromeDiscover', () => ({
  getLatestAlbums: vi.fn(),
  getSuggestedSongs: vi.fn(),
  getRecentlyPlayed: vi.fn(),
}));
vi.mock('../../lib/navidromeItems', () => ({ getAlbum: vi.fn() }));
vi.mock('../../lib/navidromeArtists', () => ({ getArtist: vi.fn() }));
vi.mock('../../lib/navidromePlaylists', () => ({ getPlaylist: vi.fn() }));
import { getRecentlyPlayed } from '../../lib/navidromeDiscover';
import { getAlbum } from '../../lib/navidromeItems';
import { getArtist } from '../../lib/navidromeArtists';
import { getPlaylist } from '../../lib/navidromePlaylists';
import { touchRecentPlay } from '../library/recentPlays';
import { History } from './History';
import { PlayerContext } from '../player/PlayerContext';
import { stubPlayer } from '../../test/renderWithProviders';
import type { MediaItem } from '../../lib/navidromeTypes';

const albums: MediaItem[] = [
  { Id: 'al1', Name: 'Last Played Album', Type: 'MusicAlbum' },
  { Id: 'al2', Name: 'Earlier Album', Type: 'MusicAlbum' },
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
  it('lists the recently-played albums', async () => {
    vi.mocked(getRecentlyPlayed).mockResolvedValue(albums);
    renderHistory();
    expect(await screen.findByText('Last Played Album')).toBeInTheDocument();
    expect(screen.getByText('Earlier Album')).toBeInTheDocument();
    expect(getRecentlyPlayed).toHaveBeenCalledWith(100);
  });

  it('shows an empty state when nothing has been played', async () => {
    vi.mocked(getRecentlyPlayed).mockResolvedValue([]);
    renderHistory();
    await waitFor(() => expect(screen.getByTestId('load-empty')).toBeInTheDocument());
  });

  it('also shows recently-played collections (playlists/artists) and opens them', async () => {
    vi.mocked(getRecentlyPlayed).mockResolvedValue(albums);
    // Seed the local recent-plays store with a played playlist; useJumpBackIn
    // hydrates it via getAlbum/getArtist/getPlaylist (in that order, since a
    // recent play has no stored kind) into the collections shelf.
    touchRecentPlay('pl1', 1000);
    vi.mocked(getAlbum).mockRejectedValue(new Error('not an album'));
    vi.mocked(getArtist).mockRejectedValue(new Error('not an artist'));
    vi.mocked(getPlaylist).mockResolvedValue({ Id: 'pl1', Name: 'My Mix', Type: 'Playlist' });
    renderHistory();
    expect(await screen.findByText('My Mix')).toBeInTheDocument();
    // The albums section still renders alongside it.
    expect(await screen.findByText('Last Played Album')).toBeInTheDocument();
    // Tapping the collection card opens its detail page (covers the open handler).
    const { default: userEvent } = await import('@testing-library/user-event');
    await userEvent.click(screen.getAllByTestId('album-card-open')[0]);
    expect(screen.getByTestId('loc')).toHaveTextContent('/playlist/pl1');
  });
});
