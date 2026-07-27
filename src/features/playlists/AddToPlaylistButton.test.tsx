import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/navidromePlaylists', () => ({
  getPlaylists: vi.fn().mockResolvedValue([]),
  createPlaylist: vi.fn(),
  createPlaylistWithItems: vi.fn(),
  getPlaylistItems: vi.fn(),
  addToPlaylist: vi.fn(),
}));
import { AddToPlaylistButton } from './AddToPlaylistButton';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { MediaItem } from '../../lib/navidromeTypes';

const track: MediaItem = { Id: 't1', Name: 'x', Type: 'Audio' };

describe('AddToPlaylistButton', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders the add-to-playlist trigger', () => {
    renderWithProviders(<AddToPlaylistButton track={track} />);
    expect(screen.getByTestId('add-to-playlist')).toBeInTheDocument();
  });
});
