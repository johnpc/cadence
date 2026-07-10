import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinPlaylists', () => ({
  getPlaylistIsPublic: vi.fn(),
  setPlaylistIsPublic: vi.fn(),
}));
import { getPlaylistIsPublic, setPlaylistIsPublic } from '../../lib/jellyfinPlaylists';
import { PlaylistVisibilityToggle } from './PlaylistVisibilityToggle';
import { ToastContext } from '../toast/ToastContext';

function renderToggle(owned = true, toast = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ToastContext.Provider value={toast}>
        <PlaylistVisibilityToggle playlistId="pl1" owned={owned} />
      </ToastContext.Provider>
    </QueryClientProvider>,
  );
  return toast;
}

describe('PlaylistVisibilityToggle', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders nothing for a playlist the user does not own', () => {
    vi.mocked(getPlaylistIsPublic).mockResolvedValue(false);
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <PlaylistVisibilityToggle playlistId="pl1" owned={false} />
      </QueryClientProvider>,
    );
    expect(container).toBeEmptyDOMElement();
    expect(getPlaylistIsPublic).not.toHaveBeenCalled();
  });

  it('reflects the current visibility (public pressed when public)', async () => {
    vi.mocked(getPlaylistIsPublic).mockResolvedValue(true);
    renderToggle();
    await waitFor(() =>
      expect(screen.getByTestId('playlist-public')).toHaveAttribute('aria-pressed', 'true'),
    );
    expect(screen.getByTestId('playlist-private')).toHaveAttribute('aria-pressed', 'false');
  });

  it('makes a private playlist public and toasts', async () => {
    vi.mocked(getPlaylistIsPublic).mockResolvedValue(false);
    vi.mocked(setPlaylistIsPublic).mockResolvedValue();
    const toast = renderToggle();
    await screen.findByTestId('playlist-public');
    await userEvent.click(screen.getByTestId('playlist-public'));
    expect(setPlaylistIsPublic).toHaveBeenCalledWith('pl1', true);
    await waitFor(() => expect(toast).toHaveBeenCalledWith('Playlist is public'));
  });

  it('rolls back + toasts an error when the flip fails', async () => {
    vi.mocked(getPlaylistIsPublic).mockResolvedValue(false);
    vi.mocked(setPlaylistIsPublic).mockRejectedValue(new Error('403'));
    const toast = renderToggle();
    await screen.findByTestId('playlist-public');
    await userEvent.click(screen.getByTestId('playlist-public'));
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Couldn't make it public"));
    // rolled back to private
    expect(screen.getByTestId('playlist-private')).toHaveAttribute('aria-pressed', 'true');
  });
});
