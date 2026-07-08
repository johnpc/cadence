import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinDiscover', () => ({
  getLatestAlbums: vi.fn(),
  getSuggestedSongs: vi.fn(),
  getRecentlyPlayed: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../lib/jellyfinItems', () => ({ getFavoriteAlbums: vi.fn().mockResolvedValue([]) }));
vi.mock('../../lib/jellyfinArtists', () => ({ getFavoriteArtists: vi.fn().mockResolvedValue([]) }));
vi.mock('../player/usePlayItem', () => ({ usePlayItem: () => vi.fn() }));
import { getLatestAlbums, getSuggestedSongs, getRecentlyPlayed } from '../../lib/jellyfinDiscover';
import { getFavoriteAlbums } from '../../lib/jellyfinItems';
import { getFavoriteArtists } from '../../lib/jellyfinArtists';
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

  it('shows a Your artists shelf when the user follows artists', async () => {
    vi.mocked(getLatestAlbums).mockResolvedValue([]);
    vi.mocked(getSuggestedSongs).mockResolvedValue([]);
    vi.mocked(getFavoriteArtists).mockResolvedValue([
      { Id: 'ar1', Name: 'Radiohead', Type: 'MusicArtist' },
    ]);
    renderWithProviders(<Home />);
    await waitFor(() => expect(screen.getByText('Your artists')).toBeInTheDocument());
    expect(screen.getByText('Radiohead')).toBeInTheDocument();
  });

  it('shows a Recently played shelf with a Show all link to the history page', async () => {
    vi.mocked(getLatestAlbums).mockResolvedValue([]);
    vi.mocked(getSuggestedSongs).mockResolvedValue([]);
    vi.mocked(getRecentlyPlayed).mockResolvedValue([song]);
    renderWithProviders(<Home />);
    await waitFor(() => expect(screen.getByText('Recently played')).toBeInTheDocument());
    const seeAll = screen.getByTestId('shelf-see-all');
    expect(seeAll).toHaveAttribute('href', '/history');
  });

  it('shows an empty state per shelf when there is no data', async () => {
    vi.mocked(getLatestAlbums).mockResolvedValue([]);
    vi.mocked(getSuggestedSongs).mockResolvedValue([]);
    renderWithProviders(<Home />);
    await waitFor(() => expect(screen.getAllByTestId('load-empty').length).toBeGreaterThan(0));
  });
});
