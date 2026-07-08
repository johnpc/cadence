import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({
  getFavoriteSongs: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}));
import { getFavoriteSongs } from '../../lib/jellyfinItems';
import { LikedSongs } from './LikedSongs';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const songs: JellyfinItem[] = [
  { Id: 'a', Name: 'Liked A', Type: 'Audio', Artists: ['X'] },
  { Id: 'b', Name: 'Liked B', Type: 'Audio' },
];

describe('LikedSongs', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders the liked songs', async () => {
    vi.mocked(getFavoriteSongs).mockResolvedValue(songs);
    renderWithProviders(<LikedSongs />);
    await waitFor(() => expect(screen.getByText('Liked A')).toBeInTheDocument());
    expect(screen.getByText('Liked B')).toBeInTheDocument();
  });

  it('plays all liked songs from the top', async () => {
    vi.mocked(getFavoriteSongs).mockResolvedValue(songs);
    const playQueue = vi.fn();
    renderWithProviders(<LikedSongs />, { player: stubPlayer({ playQueue }) });
    await waitFor(() => expect(screen.getByTestId('play-all')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('play-all'));
    expect(playQueue).toHaveBeenCalledWith(songs, 0);
  });

  it('shows an empty state when there are no liked songs', async () => {
    vi.mocked(getFavoriteSongs).mockResolvedValue([]);
    renderWithProviders(<LikedSongs />);
    await waitFor(() => expect(screen.getByTestId('load-empty')).toBeInTheDocument());
  });
});
