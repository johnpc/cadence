import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({
  getItem: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  getItemTracks: vi.fn(),
  getInstantMix: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../lib/jellyfinPlaylists', () => ({
  getPlaylists: vi.fn().mockResolvedValue([]),
  getPlaylistItems: vi.fn().mockResolvedValue([]),
  addToPlaylist: vi.fn(),
}));
import { getItem, getInstantMix } from '../../lib/jellyfinItems';
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
  ProductionYear: 1985,
};
const album: JellyfinItem = { Id: 'al1', Name: 'The Album', Type: 'MusicAlbum' };
const artist: JellyfinItem = { Id: 'ar1', Name: 'The Artist', Type: 'MusicArtist' };

/** getItem serves the song, its album, and its artist by id — the page fetches
 * all three to build the rich context cards. */
function itemById(id: string): Promise<JellyfinItem> {
  if (id === 'al1') return Promise.resolve(album);
  if (id === 'ar1') return Promise.resolve(artist);
  return Promise.resolve(song);
}

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
    vi.mocked(getItem).mockImplementation(itemById);
    renderSong();
    expect(await screen.findByRole('heading', { name: 'A Song' })).toBeInTheDocument();
    expect(screen.getByTestId('song-links').querySelector('a[href="/artist/ar1"]')).not.toBeNull();
    expect(screen.getByTestId('song-links').querySelector('a[href="/album/al1"]')).not.toBeNull();
  });

  it('shows the year·duration meta line', async () => {
    vi.mocked(getItem).mockImplementation(itemById);
    renderSong();
    await screen.findByRole('heading', { name: 'A Song' });
    expect(screen.getByText('1985 · 3:00')).toBeInTheDocument();
  });

  it('shows rich album and artist context cards', async () => {
    vi.mocked(getItem).mockImplementation(itemById);
    renderSong();
    await screen.findByRole('heading', { name: 'A Song' });
    await waitFor(() =>
      expect(screen.getByTestId('song-about-album')).toHaveAttribute('href', '/album/al1'),
    );
    expect(screen.getByTestId('song-about-artist')).toHaveAttribute('href', '/artist/ar1');
  });

  it('shows a skeleton while the song loads', async () => {
    let resolve: (v: JellyfinItem) => void = () => {};
    vi.mocked(getItem).mockReturnValue(new Promise<JellyfinItem>((r) => (resolve = r)));
    renderSong();
    expect(screen.getByTestId('song-skeleton')).toBeInTheDocument();
    resolve(song);
    await screen.findByRole('heading', { name: 'A Song' });
  });

  it('plays the song when the play button is tapped', async () => {
    vi.mocked(getItem).mockImplementation(itemById);
    const playQueue = vi.fn();
    renderSong(playQueue);
    await screen.findByRole('heading', { name: 'A Song' });
    await userEvent.click(screen.getByTestId('song-play'));
    expect(playQueue).toHaveBeenCalledWith([song], 0);
  });

  it('starts song radio from the current track', async () => {
    vi.mocked(getItem).mockImplementation(itemById);
    vi.mocked(getInstantMix).mockResolvedValue([song]);
    renderSong();
    await screen.findByRole('heading', { name: 'A Song' });
    await userEvent.click(screen.getByTestId('song-radio'));
    await waitFor(() => expect(getInstantMix).toHaveBeenCalledWith('s1'));
  });

  it('lists the playlists the song appears in', async () => {
    vi.mocked(getItem).mockImplementation(itemById);
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

  it('shows a "not found" empty state (not a blank page) for a missing song', async () => {
    // A resolved-but-null song (deleted/invalid id) must not leave a blank page.
    vi.mocked(getItem).mockResolvedValue(null as unknown as JellyfinItem);
    renderSong();
    await waitFor(() => expect(screen.getByText('Song not found')).toBeInTheDocument());
    expect(screen.queryByTestId('song-detail')).not.toBeInTheDocument();
  });
});
