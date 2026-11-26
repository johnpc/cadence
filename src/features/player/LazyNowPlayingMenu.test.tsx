import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../playlists/playlistsApi', () => ({
  usePlaylists: () => ({ playlists: [] }),
  useAddToPlaylist: () => ({ mutate: vi.fn() }),
}));
import { LazyNowPlayingMenu } from './LazyNowPlayingMenu';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

describe('LazyNowPlayingMenu', () => {
  it('holds an inert More button, then the real menu once its chunk loads', async () => {
    const track: JellyfinItem = { Id: 's1', Name: 'Song', Type: 'Audio' };
    renderWithProviders(<LazyNowPlayingMenu track={track} onNavigate={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'More options' })).toBeDisabled();
    expect(await screen.findByTestId('full-player-more')).toBeEnabled();
  });
});
