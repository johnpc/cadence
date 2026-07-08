import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({
  getFavoriteSongs: vi.fn().mockResolvedValue([]),
  getFavoriteAlbums: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../lib/jellyfinArtists', () => ({ getFavoriteArtists: vi.fn().mockResolvedValue([]) }));
vi.mock('../../lib/jellyfinPlaylists', () => ({
  getPlaylists: vi.fn().mockResolvedValue([]),
  createPlaylist: vi.fn(),
}));
import { getFavoriteSongs, getFavoriteAlbums } from '../../lib/jellyfinItems';
import { getFavoriteArtists } from '../../lib/jellyfinArtists';
import { getPlaylists } from '../../lib/jellyfinPlaylists';
import { Library } from './Library';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const song: JellyfinItem = { Id: 'l1', Name: 'Liked One', Type: 'Audio', Artists: ['A'] };
const playlist: JellyfinItem = { Id: 'p1', Name: 'Road Trip', Type: 'Playlist' };
const album: JellyfinItem = {
  Id: 'a1',
  Name: 'OK Computer',
  Type: 'MusicAlbum',
  AlbumArtist: 'RH',
};
const artist: JellyfinItem = { Id: 'ar1', Name: 'Radiohead', Type: 'MusicArtist' };

describe('Library', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows a settings link', () => {
    renderWithProviders(<Library />);
    expect(screen.getByTestId('library-settings')).toBeInTheDocument();
  });

  it('pins Liked Songs and lists playlists by default', async () => {
    vi.mocked(getFavoriteSongs).mockResolvedValue([song]);
    vi.mocked(getPlaylists).mockResolvedValue([playlist]);
    renderWithProviders(<Library />);
    await waitFor(() => expect(screen.getByText('Road Trip')).toBeInTheDocument());
    expect(screen.getByText('Liked Songs')).toBeInTheDocument();
  });

  it('switches to albums and artists via the filter pills', async () => {
    vi.mocked(getFavoriteAlbums).mockResolvedValue([album]);
    vi.mocked(getFavoriteArtists).mockResolvedValue([artist]);
    renderWithProviders(<Library />);
    await userEvent.click(screen.getByTestId('library-filter-albums'));
    await waitFor(() => expect(screen.getByText('OK Computer')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('library-filter-artists'));
    await waitFor(() => expect(screen.getByText('Radiohead')).toBeInTheDocument());
  });
});
