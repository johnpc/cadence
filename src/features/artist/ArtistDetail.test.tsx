import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({
  getItem: vi.fn(),
  getItemTracks: vi.fn(),
  getInstantMix: vi.fn().mockResolvedValue([]),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}));
vi.mock('../../lib/jellyfinPlaylists', () => ({ getPlaylists: vi.fn().mockResolvedValue([]) }));
vi.mock('../../lib/jellyfinArtists', () => ({
  getArtistAlbums: vi.fn(),
  getArtistTopTracks: vi.fn(),
  getArtistsByIds: vi.fn().mockResolvedValue([]),
  getFavoriteArtists: vi.fn().mockResolvedValue([]),
}));
import { getItem, getInstantMix } from '../../lib/jellyfinItems';
import { getArtistAlbums, getArtistTopTracks, getArtistsByIds } from '../../lib/jellyfinArtists';
import { ArtistDetail } from './ArtistDetail';
import { PlayerContext } from '../player/PlayerContext';
import { stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const artist: JellyfinItem = { Id: 'ar', Name: 'The Artist', Type: 'MusicArtist' };
const albums: JellyfinItem[] = [
  { Id: 'al1', Name: 'First Album', Type: 'MusicAlbum', ProductionYear: 2019 },
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
    vi.mocked(getInstantMix).mockResolvedValue([]);
    vi.mocked(getArtistsByIds).mockResolvedValue([]);
  });
  afterEach(() => {
    vi.resetAllMocks();
    // useArtistAlbums persists to localStorage; clear it so one test's albums
    // don't seed the next test's query via initialData.
    localStorage.clear();
  });

  it('shows the artist name and their albums', async () => {
    vi.mocked(getItem).mockResolvedValue(artist);
    vi.mocked(getArtistAlbums).mockResolvedValue(albums);
    renderArtist();
    expect(await screen.findByText('First Album')).toBeInTheDocument();
    expect(screen.getByText('Second Album')).toBeInTheDocument();
    expect(screen.getByText('2019')).toBeInTheDocument(); // release year on the card
    expect(getArtistAlbums).toHaveBeenCalledWith('ar');
  });

  it('splits the discography into Albums and Singles & EPs sections', async () => {
    vi.mocked(getItem).mockResolvedValue(artist);
    vi.mocked(getArtistAlbums).mockResolvedValue([
      { Id: 'lp', Name: 'The LP', Type: 'MusicAlbum', ChildCount: 11 },
      { Id: 'sg', Name: 'The Single', Type: 'MusicAlbum', ChildCount: 2 },
    ]);
    renderArtist();
    expect(await screen.findByText('Albums')).toBeInTheDocument();
    expect(screen.getByText('Singles & EPs')).toBeInTheDocument();
    expect(screen.getByTestId('artist-albums')).toHaveTextContent('The LP');
    expect(screen.getByTestId('artist-albums-singles')).toHaveTextContent('The Single');
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

  it('offers a radio button that starts the artist radio', async () => {
    vi.mocked(getItem).mockResolvedValue(artist);
    vi.mocked(getArtistAlbums).mockResolvedValue(albums);
    vi.mocked(getInstantMix).mockResolvedValue([
      { Id: 'mix1', Name: 'Radio Track', Type: 'Audio' },
    ]);
    renderArtist();
    const radio = await screen.findByTestId('artist-radio');
    await userEvent.click(radio); // exercises onRadio → playItem(artist)
    await waitFor(() => expect(getInstantMix).toHaveBeenCalled());
  });

  it('shows a "Fans also like" section with related artists', async () => {
    vi.mocked(getItem).mockResolvedValue(artist);
    vi.mocked(getArtistAlbums).mockResolvedValue(albums);
    vi.mocked(getArtistsByIds).mockResolvedValue([
      { Id: 'rel1', Name: 'Related One', Type: 'MusicArtist' },
    ]);
    renderArtist();
    expect(await screen.findByText('Fans also like')).toBeInTheDocument();
    expect(screen.getByText('Related One')).toBeInTheDocument();
  });

  it('shows an empty state when the artist has no albums', async () => {
    vi.mocked(getItem).mockResolvedValue(artist);
    vi.mocked(getArtistAlbums).mockResolvedValue([]);
    renderArtist();
    await waitFor(() => expect(screen.getByTestId('load-empty')).toBeInTheDocument());
  });

  it('shows an error state and retries the albums fetch', async () => {
    vi.mocked(getItem).mockResolvedValue(artist);
    vi.mocked(getArtistAlbums)
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(albums);
    renderArtist();
    await userEvent.click(await screen.findByRole('button', { name: /try again/i }));
    expect(await screen.findByText('First Album')).toBeInTheDocument(); // refetch succeeded
  });

  it('shows genre chips when the artist has genres', async () => {
    vi.mocked(getItem).mockResolvedValue({ ...artist, Genres: ['Indie', 'Alternative'] });
    vi.mocked(getArtistAlbums).mockResolvedValue(albums);
    renderArtist();
    expect(await screen.findByTestId('genre-chips')).toHaveTextContent('Indie');
  });

  it('shows an About section when the artist has a bio', async () => {
    vi.mocked(getItem).mockResolvedValue({ ...artist, Overview: 'A prolific indie act.' });
    vi.mocked(getArtistAlbums).mockResolvedValue(albums);
    renderArtist();
    expect(await screen.findByTestId('artist-about')).toHaveTextContent('A prolific indie act.');
  });
});
