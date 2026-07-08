import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({
  getItem: vi.fn(),
  getItemTracks: vi.fn(),
  getInstantMix: vi.fn(),
}));
vi.mock('../../lib/jellyfinArtists', () => ({ getArtistAlbums: vi.fn() }));
import { getItem } from '../../lib/jellyfinItems';
import { getArtistAlbums } from '../../lib/jellyfinArtists';
import { ArtistDetail } from './ArtistDetail';
import { PlayerContext } from '../player/PlayerContext';
import { stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const artist: JellyfinItem = { Id: 'ar', Name: 'The Artist', Type: 'MusicArtist' };
const albums: JellyfinItem[] = [
  { Id: 'al1', Name: 'First Album', Type: 'MusicAlbum' },
  { Id: 'al2', Name: 'Second Album', Type: 'MusicAlbum' },
];

function renderArtist() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PlayerContext.Provider value={stubPlayer()}>
        <MemoryRouter initialEntries={['/artist/ar']}>
          <Route path="/artist/:id">
            <ArtistDetail />
          </Route>
        </MemoryRouter>
      </PlayerContext.Provider>
    </QueryClientProvider>,
  );
}

describe('ArtistDetail', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows the artist name and their albums', async () => {
    vi.mocked(getItem).mockResolvedValue(artist);
    vi.mocked(getArtistAlbums).mockResolvedValue(albums);
    renderArtist();
    expect(await screen.findByText('First Album')).toBeInTheDocument();
    expect(screen.getByText('Second Album')).toBeInTheDocument();
    expect(getArtistAlbums).toHaveBeenCalledWith('ar');
  });

  it('offers a radio button once the artist loads', async () => {
    vi.mocked(getItem).mockResolvedValue(artist);
    vi.mocked(getArtistAlbums).mockResolvedValue(albums);
    renderArtist();
    expect(await screen.findByTestId('artist-radio')).toBeInTheDocument();
  });

  it('shows an empty state when the artist has no albums', async () => {
    vi.mocked(getItem).mockResolvedValue(artist);
    vi.mocked(getArtistAlbums).mockResolvedValue([]);
    renderArtist();
    await waitFor(() => expect(screen.getByTestId('load-empty')).toBeInTheDocument());
  });
});
