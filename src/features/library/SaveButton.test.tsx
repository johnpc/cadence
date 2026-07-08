import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({ addFavorite: vi.fn(), removeFavorite: vi.fn() }));
import { addFavorite } from '../../lib/jellyfinItems';
import { SaveButton } from './SaveButton';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const album: JellyfinItem = {
  Id: 'al1',
  Name: 'x',
  Type: 'MusicAlbum',
  UserData: { IsFavorite: false },
};

describe('SaveButton', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('saves on click and reflects pressed state', async () => {
    vi.mocked(addFavorite).mockResolvedValue();
    renderWithProviders(<SaveButton item={album} />);
    const btn = screen.getByTestId('save-button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(btn);
    await waitFor(() => expect(btn).toHaveAttribute('aria-pressed', 'true'));
    expect(addFavorite).toHaveBeenCalledWith('al1');
  });

  it('is disabled when there is no item', () => {
    renderWithProviders(<SaveButton item={null} />);
    expect(screen.getByTestId('save-button')).toBeDisabled();
  });
});
