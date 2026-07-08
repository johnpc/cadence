import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({
  getItem: vi.fn(),
  getItemTracks: vi.fn(),
  getInstantMix: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}));
vi.mock('../../lib/jellyfinPlaylists', () => ({ getPlaylists: vi.fn().mockResolvedValue([]) }));
vi.mock('../../lib/jellyfinArtists', () => ({
  getArtistAlbums: vi.fn(),
  getArtistTopTracks: vi.fn(),
  getFavoriteArtists: vi.fn().mockResolvedValue([]),
}));
import { getItem } from '../../lib/jellyfinItems';
import { getArtistAlbums, getArtistTopTracks } from '../../lib/jellyfinArtists';
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
  beforeEach(() => {
    vi.mocked(getArtistTopTracks).mockResolvedValue([]);
  });
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

  it('shows a Popular section with the artist top tracks', async () => {
    vi.mocked(getItem).mockResolvedValue(artist);
    vi.mocked(getArtistAlbums).mockResolvedValue(albums);
    vi.mocked(getArtistTopTracks).mockResolvedValue([
      { Id: 't1', Name: 'Hit Song', Type: 'Audio', Artists: ['The Artist'] },
    ]);
    renderArtist();
    expect(await screen.findByText('Hit Song')).toBeInTheDocument();
    expect(screen.getByTestId('artist-top')).toBeInTheDocument();
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
