import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({ addFavorite: vi.fn(), removeFavorite: vi.fn() }));
import { addFavorite } from '../../lib/jellyfinItems';
import { LikeButton } from './LikeButton';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track: JellyfinItem = { Id: 't1', Name: 'x', Type: 'Audio', UserData: { IsFavorite: false } };

describe('LikeButton', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('toggles like on click and reflects pressed state', async () => {
    vi.mocked(addFavorite).mockResolvedValue();
    renderWithProviders(<LikeButton track={track} />);
    const btn = screen.getByTestId('like-button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(btn);
    await waitFor(() => expect(btn).toHaveAttribute('aria-pressed', 'true'));
    expect(addFavorite).toHaveBeenCalledWith('t1');
  });

  it('re-seeds the heart when the track changes under a mounted button', () => {
    // The mini-player + full player keep ONE LikeButton mounted across track
    // changes — the heart must follow the new track's liked state.
    const likedTrack: JellyfinItem = { ...track, Id: 'a', UserData: { IsFavorite: true } };
    const unlikedTrack: JellyfinItem = { ...track, Id: 'b', UserData: { IsFavorite: false } };
    const { rerender } = renderWithProviders(<LikeButton track={likedTrack} />);
    expect(screen.getByTestId('like-button')).toHaveAttribute('aria-pressed', 'true');
    rerender(<LikeButton track={unlikedTrack} />);
    expect(screen.getByTestId('like-button')).toHaveAttribute('aria-pressed', 'false');
  });
});
