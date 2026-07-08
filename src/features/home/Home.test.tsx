import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinDiscover', () => ({
  getLatestAlbums: vi.fn(),
  getSuggestedSongs: vi.fn(),
  getRecentlyPlayed: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../lib/jellyfinItems', () => ({ getFavoriteAlbums: vi.fn().mockResolvedValue([]) }));
vi.mock('../player/usePlayItem', () => ({ usePlayItem: () => vi.fn() }));
import { getLatestAlbums, getSuggestedSongs } from '../../lib/jellyfinDiscover';
import { getFavoriteAlbums } from '../../lib/jellyfinItems';
import { Home } from './Home';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const album: JellyfinItem = { Id: 'al', Name: 'Fresh Album', Type: 'MusicAlbum', AlbumArtist: 'A' };
const song: JellyfinItem = { Id: 's', Name: 'Suggested Song', Type: 'Audio', Artists: ['B'] };

describe('Home', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders recommendation shelves with real data', async () => {
    vi.mocked(getLatestAlbums).mockResolvedValue([album]);
    vi.mocked(getSuggestedSongs).mockResolvedValue([song]);
    renderWithProviders(<Home />);
    expect(screen.getByTestId('home-greeting')).toBeInTheDocument();
    expect(screen.getByText('Recently added')).toBeInTheDocument();
    expect(screen.getByText('Suggested for you')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Fresh Album')).toBeInTheDocument());
    expect(screen.getByText('Suggested Song')).toBeInTheDocument();
  });

  it('shows a From your library shelf when albums are saved', async () => {
    vi.mocked(getLatestAlbums).mockResolvedValue([]);
    vi.mocked(getSuggestedSongs).mockResolvedValue([]);
    vi.mocked(getFavoriteAlbums).mockResolvedValue([
      { ...album, Id: 'saved1', Name: 'Saved Album' },
    ]);
    renderWithProviders(<Home />);
    await waitFor(() => expect(screen.getByText('From your library')).toBeInTheDocument());
    expect(screen.getByText('Saved Album')).toBeInTheDocument();
  });

  it('shows an empty state per shelf when there is no data', async () => {
    vi.mocked(getLatestAlbums).mockResolvedValue([]);
    vi.mocked(getSuggestedSongs).mockResolvedValue([]);
    renderWithProviders(<Home />);
    await waitFor(() => expect(screen.getAllByTestId('load-empty').length).toBeGreaterThan(0));
  });
});
