import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({
  getItem: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}));
vi.mock('../../lib/jellyfinPlaylists', () => ({
  getPlaylists: vi.fn().mockResolvedValue([]),
  getPlaylistItems: vi.fn().mockResolvedValue([]),
}));
import { getItem } from '../../lib/jellyfinItems';
import { getPlaylists, getPlaylistItems } from '../../lib/jellyfinPlaylists';
import { SongDetail } from './SongDetail';
import { PlayerContext } from '../player/PlayerContext';
import { stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const song: JellyfinItem = {
  Id: 's1',
  Name: 'A Song',
  Type: 'Audio',
  Album: 'The Album',
  AlbumId: 'al1',
  ArtistItems: [{ Id: 'ar1', Name: 'The Artist' }],
  RunTimeTicks: 1_800_000_000,
};

function renderSong(playQueue = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <PlayerContext.Provider value={stubPlayer({ playQueue })}>
        <MemoryRouter initialEntries={['/song/s1']}>
          <Route path="/song/:id">
            <SongDetail />
          </Route>
        </MemoryRouter>
      </PlayerContext.Provider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('SongDetail', () => {
  it('shows the title with linked artist and album', async () => {
    vi.mocked(getItem).mockResolvedValue(song);
    renderSong();
    expect(await screen.findByRole('heading', { name: 'A Song' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'The Artist' })).toHaveAttribute('href', '/artist/ar1');
    expect(screen.getByRole('link', { name: 'The Album' })).toHaveAttribute('href', '/album/al1');
  });

  it('plays the song when the play button is tapped', async () => {
    vi.mocked(getItem).mockResolvedValue(song);
    const playQueue = vi.fn();
    renderSong(playQueue);
    await screen.findByRole('heading', { name: 'A Song' });
    await userEvent.click(screen.getByTestId('song-play'));
    expect(playQueue).toHaveBeenCalledWith([song], 0);
  });

  it('lists the playlists the song appears in', async () => {
    vi.mocked(getItem).mockResolvedValue(song);
    vi.mocked(getPlaylists).mockResolvedValue([{ Id: 'p1', Name: 'My Mix', Type: 'Playlist' }]);
    vi.mocked(getPlaylistItems).mockResolvedValue([song]);
    renderSong();
    expect(await screen.findByRole('link', { name: 'My Mix' })).toHaveAttribute(
      'href',
      '/playlist/p1',
    );
  });

  it('shows an error state when the song fails to load', async () => {
    vi.mocked(getItem).mockRejectedValue(new Error('boom'));
    renderSong();
    await waitFor(() => expect(screen.getByText(/try again/i)).toBeInTheDocument());
  });
});
