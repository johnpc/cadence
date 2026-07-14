import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    localStorage.clear();
    document.body.classList.remove('app-sidebar-collapsed');
    delete window.__CADENCE_CONFIG__;
  });

  it('shows primary nav links to Home, Search, and Your Library', () => {
    renderWithProviders(<DesktopSidebar />);
    expect(screen.getByRole('link', { name: /Home/ })).toHaveAttribute('href', '/home');
    expect(screen.getByRole('link', { name: /Search/ })).toHaveAttribute('href', '/search');
    expect(screen.getByRole('link', { name: /Your Library/ })).toHaveAttribute('href', '/library');
  });

  it('hides the Requests link when the Lidarr proxy is not enabled', () => {
    renderWithProviders(<DesktopSidebar />);
    expect(screen.queryByTestId('nav-requests')).not.toBeInTheDocument();
  });

  it('shows a Requests link (matching the mobile tab) when the Lidarr proxy is on', () => {
    window.__CADENCE_CONFIG__ = { lidarrProxy: true };
    renderWithProviders(<DesktopSidebar />);
    expect(screen.getByTestId('nav-requests')).toHaveAttribute('href', '/requests');
  });

  it('embeds the library list', async () => {
    renderWithProviders(<DesktopSidebar />);
    await waitFor(() => expect(screen.getByText('Road Trip')).toBeInTheDocument());
    expect(screen.getByTestId('library-list')).toBeInTheDocument();
  });

  it('collapses and expands via the toggle, flagging the body + persisting', async () => {
    renderWithProviders(<DesktopSidebar />);
    const toggle = screen.getByTestId('sidebar-collapse');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(document.body).toHaveClass('app-sidebar-collapsed');
    expect(localStorage.getItem('cadence.sidebar-collapsed')).toBe('1');

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(document.body).not.toHaveClass('app-sidebar-collapsed');
    expect(localStorage.getItem('cadence.sidebar-collapsed')).toBe('0');
  });

  it('restores the collapsed state from storage on mount', () => {
    localStorage.setItem('cadence.sidebar-collapsed', '1');
    renderWithProviders(<DesktopSidebar />);
    expect(screen.getByTestId('sidebar-collapse')).toHaveAttribute('aria-expanded', 'false');
  });
});
