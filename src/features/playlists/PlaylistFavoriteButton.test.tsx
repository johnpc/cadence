import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({ addFavorite: vi.fn(), removeFavorite: vi.fn() }));
import { addFavorite } from '../../lib/jellyfinItems';
import { PlaylistFavoriteButton } from './PlaylistFavoriteButton';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const playlist: JellyfinItem = {
  Id: 'p1',
  Name: 'Faves',
  Type: 'Playlist',
  UserData: { IsFavorite: false },
};

describe('PlaylistFavoriteButton', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders nothing until the playlist loads', () => {
    const { container } = renderWithProviders(<PlaylistFavoriteButton playlist={null} />);
    expect(container.querySelector('[data-testid="playlist-favorite"]')).toBeNull();
  });

  it('favorites the playlist on click and reflects pressed state', async () => {
    vi.mocked(addFavorite).mockResolvedValue();
    renderWithProviders(<PlaylistFavoriteButton playlist={playlist} />);
    const btn = screen.getByTestId('playlist-favorite');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(btn);
    await waitFor(() => expect(btn).toHaveAttribute('aria-pressed', 'true'));
    expect(addFavorite).toHaveBeenCalledWith('p1');
  });
});
