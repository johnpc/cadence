import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({ getFavoriteAlbums: vi.fn() }));
import { getFavoriteAlbums } from '../../lib/jellyfinItems';
import { SavedAlbums } from './SavedAlbums';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const albums: JellyfinItem[] = [
  { Id: 'al1', Name: 'Saved One', Type: 'MusicAlbum', AlbumArtist: 'Band' },
  { Id: 'al2', Name: 'Saved Two', Type: 'MusicAlbum' },
];

describe('SavedAlbums', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders saved albums linking to their detail pages', async () => {
    vi.mocked(getFavoriteAlbums).mockResolvedValue(albums);
    renderWithProviders(<SavedAlbums />);
    await waitFor(() => expect(screen.getByText('Saved One')).toBeInTheDocument());
    expect(screen.getAllByTestId('saved-album-row')[0]).toHaveAttribute('href', '/album/al1');
  });

  it('shows an empty state when nothing is saved', async () => {
    vi.mocked(getFavoriteAlbums).mockResolvedValue([]);
    renderWithProviders(<SavedAlbums />);
    await waitFor(() => expect(screen.getByTestId('load-empty')).toBeInTheDocument());
  });
});
