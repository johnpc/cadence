import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({
  getFavoriteSongs: vi.fn().mockResolvedValue([]),
  getFavoriteAlbums: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../lib/jellyfinArtists', () => ({ getFavoriteArtists: vi.fn().mockResolvedValue([]) }));
vi.mock('../../lib/jellyfinPlaylists', () => ({
  getPlaylists: vi.fn().mockResolvedValue([{ Id: 'p1', Name: 'Road Trip', Type: 'Playlist' }]),
  createPlaylist: vi.fn(),
}));
import { getFavoriteSongs, getFavoriteAlbums } from '../../lib/jellyfinItems';
import { getFavoriteArtists } from '../../lib/jellyfinArtists';
import { getPlaylists } from '../../lib/jellyfinPlaylists';
import { DesktopSidebar } from './DesktopSidebar';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('DesktopSidebar', () => {
  beforeEach(() => {
    vi.mocked(getFavoriteSongs).mockResolvedValue([]);
    vi.mocked(getFavoriteAlbums).mockResolvedValue([]);
    vi.mocked(getFavoriteArtists).mockResolvedValue([]);
    vi.mocked(getPlaylists).mockResolvedValue([{ Id: 'p1', Name: 'Road Trip', Type: 'Playlist' }]);
  });
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows primary nav links to Home, Search, and Your Library', () => {
    renderWithProviders(<DesktopSidebar />);
    expect(screen.getByRole('link', { name: /Home/ })).toHaveAttribute('href', '/home');
    expect(screen.getByRole('link', { name: /Search/ })).toHaveAttribute('href', '/search');
    expect(screen.getByRole('link', { name: /Your Library/ })).toHaveAttribute('href', '/library');
  });

  it('embeds the library list', async () => {
    renderWithProviders(<DesktopSidebar />);
    await waitFor(() => expect(screen.getByText('Road Trip')).toBeInTheDocument());
    expect(screen.getByTestId('library-list')).toBeInTheDocument();
  });
});
