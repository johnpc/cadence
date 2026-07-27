import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/navidromeItems', () => ({
  getSong: vi.fn(),
  getAlbum: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  getAlbumTracks: vi.fn(),
  getSimilarSongs: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../lib/navidromeArtists', () => ({ getArtist: vi.fn() }));
vi.mock('../../lib/navidromePlaylists', () => ({
  getPlaylists: vi.fn().mockResolvedValue([]),
  getPlaylistItems: vi.fn().mockResolvedValue([]),
  addToPlaylist: vi.fn(),
}));
import { getSong, getAlbum, getSimilarSongs } from '../../lib/navidromeItems';
import { getArtist } from '../../lib/navidromeArtists';
import { getPlaylists, getPlaylistItems } from '../../lib/navidromePlaylists';
import { SongDetail } from './SongDetail';
import { PlayerContext } from '../player/PlayerContext';
import { stubPlayer } from '../../test/renderWithProviders';
import type { MediaItem } from '../../lib/navidromeTypes';

const song: MediaItem = {
  Id: 's1',
  Name: 'A Song',
  Type: 'Audio',
  Album: 'The Album',
  AlbumId: 'al1',
  ArtistItems: [{ Id: 'ar1', Name: 'The Artist' }],
  RunTimeTicks: 1_800_000_000,
  ProductionYear: 1985,
};
const album: MediaItem = { Id: 'al1', Name: 'The Album', Type: 'MusicAlbum' };
const artist: MediaItem = { Id: 'ar1', Name: 'The Artist', Type: 'MusicArtist' };

/** getSong/getAlbum/getArtist each serve their own entity — the page fetches
 * all three to build the rich context cards. */
function mockAllResolved(): void {
  vi.mocked(getSong).mockResolvedValue(song);
  vi.mocked(getAlbum).mockResolvedValue(album);
  vi.mocked(getArtist).mockResolvedValue(artist);
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
    mockAllResolved();
    renderSong();
    expect(await screen.findByRole('heading', { name: 'A Song' })).toBeInTheDocument();
    expect(screen.getByTestId('song-links').querySelector('a[href="/artist/ar1"]')).not.toBeNull();
    expect(screen.getByTestId('song-links').querySelector('a[href="/album/al1"]')).not.toBeNull();
  });

  it('shows the year·duration meta line', async () => {
    mockAllResolved();
    renderSong();
    await screen.findByRole('heading', { name: 'A Song' });
    expect(screen.getByText('1985 · 3:00')).toBeInTheDocument();
  });

  it('shows rich album and artist context cards', async () => {
    mockAllResolved();
    renderSong();
    await screen.findByRole('heading', { name: 'A Song' });
    await waitFor(() =>
      expect(screen.getByTestId('song-about-album')).toHaveAttribute('href', '/album/al1'),
    );
    expect(screen.getByTestId('song-about-artist')).toHaveAttribute('href', '/artist/ar1');
  });

  it('shows a skeleton while the song loads', async () => {
    let resolve: (v: MediaItem) => void = () => {};
    vi.mocked(getSong).mockReturnValue(new Promise<MediaItem>((r) => (resolve = r)));
    renderSong();
    expect(screen.getByTestId('song-skeleton')).toBeInTheDocument();
    resolve(song);
    await screen.findByRole('heading', { name: 'A Song' });
  });

  it('plays the song when the play button is tapped', async () => {
    mockAllResolved();
    const playQueue = vi.fn();
    renderSong(playQueue);
    await screen.findByRole('heading', { name: 'A Song' });
    await userEvent.click(screen.getByTestId('song-play'));
    expect(playQueue).toHaveBeenCalledWith([song], 0);
  });

  it('starts song radio from the current track', async () => {
    mockAllResolved();
    vi.mocked(getSimilarSongs).mockResolvedValue([song]);
    renderSong();
    await screen.findByRole('heading', { name: 'A Song' });
    await userEvent.click(screen.getByTestId('song-radio'));
    await waitFor(() => expect(getSimilarSongs).toHaveBeenCalledWith('s1'));
  });

  it('lists the playlists the song appears in', async () => {
    mockAllResolved();
    vi.mocked(getPlaylists).mockResolvedValue([{ Id: 'p1', Name: 'My Mix', Type: 'Playlist' }]);
    vi.mocked(getPlaylistItems).mockResolvedValue([song]);
    renderSong();
    expect(await screen.findByRole('link', { name: 'My Mix' })).toHaveAttribute(
      'href',
      '/playlist/p1',
    );
  });

  it('shows an error state when the song fails to load', async () => {
    vi.mocked(getSong).mockRejectedValue(new Error('boom'));
    renderSong();
    await waitFor(() => expect(screen.getByText(/try again/i)).toBeInTheDocument());
  });

  it('shows a "not found" empty state (not a blank page) for a missing song', async () => {
    // A resolved-but-null song (deleted/invalid id) must not leave a blank page.
    vi.mocked(getSong).mockResolvedValue(null as unknown as MediaItem);
    renderSong();
    await waitFor(() => expect(screen.getByText('Song not found')).toBeInTheDocument());
    expect(screen.queryByTestId('song-detail')).not.toBeInTheDocument();
  });
});
