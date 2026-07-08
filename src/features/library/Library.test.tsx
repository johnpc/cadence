import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({ getFavoriteSongs: vi.fn() }));
import { getFavoriteSongs } from '../../lib/jellyfinItems';
import { Library } from './Library';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const liked: JellyfinItem = { Id: 'l1', Name: 'Liked One', Type: 'Audio', Artists: ['A'] };

describe('Library', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows a settings link and the liked songs', async () => {
    vi.mocked(getFavoriteSongs).mockResolvedValue([liked]);
    renderWithProviders(<Library />);
    expect(screen.getByTestId('library-settings')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Liked One')).toBeInTheDocument());
  });
});
