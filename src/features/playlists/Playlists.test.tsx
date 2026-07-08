import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinPlaylists', () => ({
  getPlaylists: vi.fn(),
  createPlaylist: vi.fn(),
  getPlaylistItems: vi.fn(),
  addToPlaylist: vi.fn(),
}));
import { getPlaylists } from '../../lib/jellyfinPlaylists';
import { Playlists } from './Playlists';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const pl: JellyfinItem = { Id: 'p1', Name: 'Road Trip', Type: 'Playlist' };

describe('Playlists', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('lists the user playlists with links to their detail pages', async () => {
    vi.mocked(getPlaylists).mockResolvedValue([pl]);
    renderWithProviders(<Playlists />);
    const row = await screen.findByTestId('playlist-row');
    expect(row).toHaveTextContent('Road Trip');
    expect(row).toHaveAttribute('href', '/playlist/p1');
  });

  it('shows an empty state when there are no playlists', async () => {
    vi.mocked(getPlaylists).mockResolvedValue([]);
    renderWithProviders(<Playlists />);
    await waitFor(() => expect(screen.getByTestId('load-empty')).toBeInTheDocument());
  });
});
