import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinPlaylists', () => ({
  getPlaylists: vi.fn().mockResolvedValue([]),
  renamePlaylist: vi.fn().mockResolvedValue(undefined),
}));
import { RenamePlaylistButton } from './RenamePlaylistButton';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('RenamePlaylistButton', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders a rename button that opens a prompt prefilled with the name', async () => {
    renderWithProviders(<RenamePlaylistButton playlistId="p1" currentName="Road Trip" />);
    const btn = screen.getByTestId('rename-playlist');
    expect(btn).toBeInTheDocument();
    await userEvent.click(btn);
    expect(document.querySelector('ion-alert')).toBeTruthy();
  });
});
