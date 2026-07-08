import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinPlaylists', () => ({
  getPlaylists: vi.fn(),
  createPlaylist: vi.fn(),
  getPlaylistItems: vi.fn(),
  addToPlaylist: vi.fn(),
}));
import { CreatePlaylist } from './CreatePlaylist';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('CreatePlaylist', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders a create button that opens the name prompt', async () => {
    renderWithProviders(<CreatePlaylist />);
    const btn = screen.getByTestId('create-playlist');
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    // IonAlert becomes present in the DOM once opened.
    await expect(document.querySelector('ion-alert')).toBeTruthy();
  });
});
