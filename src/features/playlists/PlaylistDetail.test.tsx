import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinPlaylists', () => ({
  getPlaylistItems: vi.fn(),
  getPlaylists: vi.fn().mockResolvedValue([]),
  createPlaylist: vi.fn(),
  addToPlaylist: vi.fn(),
}));
vi.mock('../../lib/jellyfinItems', () => ({ addFavorite: vi.fn(), removeFavorite: vi.fn() }));
import { getPlaylistItems } from '../../lib/jellyfinPlaylists';
import { PlaylistDetail } from './PlaylistDetail';
import { PlayerContext } from '../player/PlayerContext';
import { stubPlayer } from '../../test/renderWithProviders';
import type { PlayerContextValue } from '../player/types';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const tracks: JellyfinItem[] = [
  { Id: 'a', Name: 'PL Track A', Type: 'Audio', Artists: ['X'] },
  { Id: 'b', Name: 'PL Track B', Type: 'Audio' },
];

function renderDetail(player: PlayerContextValue = stubPlayer()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PlayerContext.Provider value={player}>
        <MemoryRouter initialEntries={['/playlist/p1']}>
          <Route path="/playlist/:id">
            <PlaylistDetail />
          </Route>
        </MemoryRouter>
      </PlayerContext.Provider>
    </QueryClientProvider>,
  );
}

describe('PlaylistDetail', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders the playlist tracks', async () => {
    vi.mocked(getPlaylistItems).mockResolvedValue(tracks);
    renderDetail();
    expect(await screen.findByText('PL Track A')).toBeInTheDocument();
    expect(getPlaylistItems).toHaveBeenCalledWith('p1');
  });

  it('plays the whole playlist from the top', async () => {
    vi.mocked(getPlaylistItems).mockResolvedValue(tracks);
    const playQueue = vi.fn();
    renderDetail(stubPlayer({ playQueue }));
    await userEvent.click(await screen.findByTestId('playlist-play-all'));
    expect(playQueue).toHaveBeenCalledWith(tracks, 0);
  });

  it('shows an empty state for an empty playlist', async () => {
    vi.mocked(getPlaylistItems).mockResolvedValue([]);
    renderDetail();
    await waitFor(() => expect(screen.getByTestId('load-empty')).toBeInTheDocument());
  });
});
