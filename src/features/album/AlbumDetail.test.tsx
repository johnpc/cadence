import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({
  getItem: vi.fn(),
  getItemTracks: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}));
vi.mock('../../lib/jellyfinPlaylists', () => ({ getPlaylists: vi.fn().mockResolvedValue([]) }));
import { getItem, getItemTracks } from '../../lib/jellyfinItems';
import { AlbumDetail } from './AlbumDetail';
import { PlayerContext } from '../player/PlayerContext';
import { stubPlayer } from '../../test/renderWithProviders';
import type { PlayerContextValue } from '../player/types';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const album: JellyfinItem = {
  Id: 'al',
  Name: 'Great Album',
  Type: 'MusicAlbum',
  AlbumArtist: 'Band',
  ProductionYear: 2015,
  Genres: ['Rock'],
};
const tracks: JellyfinItem[] = [
  { Id: 'a', Name: 'Track A', Type: 'Audio', Artists: ['Band'] },
  { Id: 'b', Name: 'Track B', Type: 'Audio' },
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
  });

  it('shows the album header and its tracks', async () => {
    vi.mocked(getItem).mockResolvedValue(album);
    vi.mocked(getItemTracks).mockResolvedValue(tracks);
    renderAlbum();
    expect(await screen.findByText('Track A')).toBeInTheDocument();
    expect(screen.getAllByText('Great Album').length).toBeGreaterThan(0);
    expect(getItemTracks).toHaveBeenCalledWith('al');
  });

  it('shows the year and genre meta line', async () => {
    vi.mocked(getItem).mockResolvedValue(album);
    vi.mocked(getItemTracks).mockResolvedValue(tracks);
    renderAlbum();
    expect(await screen.findByTestId('album-info')).toHaveTextContent('2015 • Rock');
  });

  it('shows an About section when the album has an overview', async () => {
    vi.mocked(getItem).mockResolvedValue({ ...album, Overview: 'A landmark record.' });
    vi.mocked(getItemTracks).mockResolvedValue(tracks);
    renderAlbum();
    expect(await screen.findByTestId('album-about')).toHaveTextContent('A landmark record.');
  });

  it('plays the whole album from the top', async () => {
    vi.mocked(getItem).mockResolvedValue(album);
    vi.mocked(getItemTracks).mockResolvedValue(tracks);
    const playQueue = vi.fn();
    renderAlbum(stubPlayer({ playQueue }));
    await userEvent.click(await screen.findByTestId('play-all'));
    expect(playQueue).toHaveBeenCalledWith(tracks, 0);
  });

  it('shows an empty state for an album with no tracks', async () => {
    vi.mocked(getItem).mockResolvedValue(album);
    vi.mocked(getItemTracks).mockResolvedValue([]);
    renderAlbum();
    await waitFor(() => expect(screen.getByTestId('load-empty')).toBeInTheDocument());
  });
});
