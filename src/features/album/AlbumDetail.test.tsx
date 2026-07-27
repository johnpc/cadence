import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/navidromeItems', () => ({
  getAlbum: vi.fn(),
  getAlbumTracks: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  getSimilarSongs: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../lib/navidromeItemsByIds', () => ({
  getAlbumsByIds: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../lib/navidromePlaylists', () => ({ getPlaylists: vi.fn().mockResolvedValue([]) }));
vi.mock('../../lib/navidromeArtists', () => ({ getArtistAlbums: vi.fn().mockResolvedValue([]) }));
import { getAlbum, getAlbumTracks } from '../../lib/navidromeItems';
import { AlbumDetail } from './AlbumDetail';
import { PlayerContext } from '../player/PlayerContext';
import { stubPlayer } from '../../test/renderWithProviders';
import type { PlayerContextValue } from '../player/types';
import type { MediaItem } from '../../lib/navidromeTypes';

const album: MediaItem = {
  Id: 'al',
  Name: 'Great Album',
  Type: 'MusicAlbum',
  AlbumArtist: 'Band',
  ArtistItems: [{ Id: 'ar1', Name: 'Band' }],
  ProductionYear: 2015,
  Genres: ['Rock'],
};
const tracks: MediaItem[] = [
  { Id: 'a', Name: 'Track A', Type: 'Audio', Artists: ['Band'], IndexNumber: 1 },
  { Id: 'b', Name: 'Track B', Type: 'Audio', IndexNumber: 2 },
];

function renderAlbum(player: PlayerContextValue = stubPlayer()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PlayerContext.Provider value={player}>
        <MemoryRouter initialEntries={['/album/al']}>
          <Route path="/album/:id">
            <AlbumDetail />
          </Route>
        </MemoryRouter>
      </PlayerContext.Provider>
    </QueryClientProvider>,
  );
}

describe('AlbumDetail', () => {
  afterEach(() => {
    vi.resetAllMocks();
    // useAlbumTracks persists to localStorage; clear it so one test's tracks
    // don't seed the next test's query via initialData.
    localStorage.clear();
  });

  it('shows the album header and its tracks', async () => {
    vi.mocked(getAlbum).mockResolvedValue(album);
    vi.mocked(getAlbumTracks).mockResolvedValue(tracks);
    renderAlbum();
    expect(await screen.findByText('Track A')).toBeInTheDocument();
    expect(screen.getAllByText('Great Album').length).toBeGreaterThan(0);
    expect(getAlbumTracks).toHaveBeenCalledWith('al');
  });

  it('shows the release year and genre chips', async () => {
    vi.mocked(getAlbum).mockResolvedValue(album);
    vi.mocked(getAlbumTracks).mockResolvedValue(tracks);
    renderAlbum();
    expect(await screen.findByTestId('album-info')).toHaveTextContent('2015');
    expect(screen.getByTestId('genre-chips')).toHaveTextContent('Rock');
  });

  it('numbers the album tracks', async () => {
    vi.mocked(getAlbum).mockResolvedValue(album);
    vi.mocked(getAlbumTracks).mockResolvedValue(tracks);
    renderAlbum();
    await screen.findByText('Track A');
    expect(screen.getAllByTestId('track-number').map((n) => n.textContent)).toEqual(['1', '2']);
  });

  it('shows an About section when the album has an overview', async () => {
    vi.mocked(getAlbum).mockResolvedValue({ ...album, Overview: 'A landmark record.' });
    vi.mocked(getAlbumTracks).mockResolvedValue(tracks);
    renderAlbum();
    expect(await screen.findByTestId('album-about')).toHaveTextContent('A landmark record.');
  });

  it('plays the whole album from the top', async () => {
    vi.mocked(getAlbum).mockResolvedValue(album);
    vi.mocked(getAlbumTracks).mockResolvedValue(tracks);
    const playQueue = vi.fn();
    renderAlbum(stubPlayer({ playQueue }));
    await userEvent.click(await screen.findByTestId('play-all'));
    expect(playQueue).toHaveBeenCalledWith(tracks, 0);
  });

  it('still shows the header (art, title, artist link) when the album has no tracks', async () => {
    vi.mocked(getAlbum).mockResolvedValue(album);
    vi.mocked(getAlbumTracks).mockResolvedValue([]);
    renderAlbum();
    await waitFor(() => expect(screen.getByTestId('load-empty')).toBeInTheDocument());
    // The header persists even with no tracks.
    expect(screen.getAllByText('Great Album').length).toBeGreaterThan(0);
    const link = screen.getByRole('link', { name: 'Band' });
    expect(link).toHaveAttribute('href', '/artist/ar1');
  });

  it('links the artist name to the artist page', async () => {
    vi.mocked(getAlbum).mockResolvedValue(album);
    vi.mocked(getAlbumTracks).mockResolvedValue(tracks);
    renderAlbum();
    await screen.findByText('Track A');
    expect(screen.getByRole('link', { name: 'Band' })).toHaveAttribute('href', '/artist/ar1');
  });
});
