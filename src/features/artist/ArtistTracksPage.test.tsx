import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({
  getItem: vi.fn().mockResolvedValue({ Id: 'ar', Name: 'The Band', Type: 'MusicArtist' }),
  getInstantMix: vi.fn().mockResolvedValue([]),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}));
vi.mock('../../lib/jellyfinPlaylists', () => ({ getPlaylists: vi.fn().mockResolvedValue([]) }));
vi.mock('../../lib/jellyfinArtists', () => ({
  getArtistTracks: vi.fn(),
  getArtistAlbums: vi.fn().mockResolvedValue([]),
  getArtistTopTracks: vi.fn().mockResolvedValue([]),
  getArtistsByIds: vi.fn().mockResolvedValue([]),
}));
import { getArtistTracks } from '../../lib/jellyfinArtists';
import { ArtistTracksPage } from './ArtistTracksPage';
import { PlayerContext } from '../player/PlayerContext';
import { stubPlayer } from '../../test/renderWithProviders';
import type { PlayerContextValue } from '../player/types';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const tracks: JellyfinItem[] = [
  { Id: 'a', Name: 'Alpha Song', Type: 'Audio', Artists: ['The Band'] },
  { Id: 'b', Name: 'Beta Song', Type: 'Audio' },
];

function renderPage(player: PlayerContextValue = stubPlayer()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PlayerContext.Provider value={player}>
        <MemoryRouter initialEntries={['/artist/ar/tracks']}>
          <Route path="/artist/:id/tracks">
            <ArtistTracksPage />
          </Route>
        </MemoryRouter>
      </PlayerContext.Provider>
    </QueryClientProvider>,
  );
}

describe('ArtistTracksPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lists all of the artist tracks', async () => {
    vi.mocked(getArtistTracks).mockResolvedValue(tracks);
    renderPage();
    expect(await screen.findByText('Alpha Song')).toBeInTheDocument();
    expect(screen.getByText('Beta Song')).toBeInTheDocument();
    expect(getArtistTracks).toHaveBeenCalledWith('ar');
  });

  it('plays the whole list from the top', async () => {
    vi.mocked(getArtistTracks).mockResolvedValue(tracks);
    const playQueue = vi.fn();
    renderPage(stubPlayer({ playQueue }));
    await userEvent.click(await screen.findByTestId('play-all'));
    expect(playQueue).toHaveBeenCalledWith(tracks, 0);
  });

  it('shows an empty state when the artist has no tracks', async () => {
    vi.mocked(getArtistTracks).mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByTestId('load-empty')).toBeInTheDocument());
  });
});
