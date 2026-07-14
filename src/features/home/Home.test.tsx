import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinDiscover', () => ({
  getLatestAlbums: vi.fn(),
  getSuggestedSongs: vi.fn(),
  getRecentlyPlayed: vi.fn().mockResolvedValue([]),
  getOnRepeat: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../lib/jellyfinItems', () => ({
  getFavoriteAlbums: vi.fn().mockResolvedValue([]),
  getItem: vi.fn().mockResolvedValue(null),
}));
vi.mock('../../lib/jellyfinArtists', () => ({ getFavoriteArtists: vi.fn().mockResolvedValue([]) }));
vi.mock('../../lib/jellyfinPlaylists', () => ({
  getPublicPlaylists: vi.fn().mockResolvedValue([]),
}));
vi.mock('../player/usePlayItem', () => ({ usePlayItem: () => vi.fn() }));
import {
  getLatestAlbums,
  getSuggestedSongs,
  getRecentlyPlayed,
  getOnRepeat,
} from '../../lib/jellyfinDiscover';
import { getFavoriteAlbums } from '../../lib/jellyfinItems';
import { getFavoriteArtists } from '../../lib/jellyfinArtists';
import { getPublicPlaylists } from '../../lib/jellyfinPlaylists';
import { Home } from './Home';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const album: JellyfinItem = { Id: 'al', Name: 'Fresh Album', Type: 'MusicAlbum', AlbumArtist: 'A' };
const song: JellyfinItem = { Id: 's', Name: 'Suggested Song', Type: 'Audio', Artists: ['B'] };

describe('Home', () => {
  // Clear the recent-plays store before AND after each test so a prior test's
  // plays don't enable the "Jump back in" query (which would skew the all-empty
  // no-access check).
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
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

  it('shows an On repeat shelf from your most-played tracks', async () => {
    const onRepeat: JellyfinItem = { Id: 'r', Name: 'Looped Song', Type: 'Audio', Artists: ['C'] };
    vi.mocked(getLatestAlbums).mockResolvedValue([]);
    vi.mocked(getSuggestedSongs).mockResolvedValue([]);
    vi.mocked(getOnRepeat).mockResolvedValue([onRepeat]);
    renderWithProviders(<Home />);
    await waitFor(() => expect(screen.getByText('On repeat')).toBeInTheDocument());
    expect(screen.getByText('Looped Song')).toBeInTheDocument();
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

  it('shows a From the community shelf of other users’ public playlists', async () => {
    vi.mocked(getLatestAlbums).mockResolvedValue([]);
    vi.mocked(getSuggestedSongs).mockResolvedValue([]);
    vi.mocked(getPublicPlaylists).mockResolvedValue([
      { Id: 'pub1', Name: 'Emily’s Mix', Type: 'Playlist' },
    ]);
    renderWithProviders(<Home />);
    await waitFor(() => expect(screen.getByText('From the community')).toBeInTheDocument());
    expect(screen.getByText('Emily’s Mix')).toBeInTheDocument();
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

  it('hides an empty shelf (rather than showing a bare empty box) when others have data', async () => {
    // Suggested has a song, so the library IS accessible. The empty "Recently
    // added" shelf is HIDDEN (Spotify-style) instead of showing a bare empty
    // box — but the no-access notice does NOT appear because other shelves fill.
    vi.mocked(getLatestAlbums).mockResolvedValue([]);
    vi.mocked(getSuggestedSongs).mockResolvedValue([song]);
    renderWithProviders(<Home />);
    await waitFor(() => expect(screen.getByText('Suggested Song')).toBeInTheDocument());
    expect(screen.queryByText('Recently added')).not.toBeInTheDocument();
    expect(screen.queryByTestId('home-no-access')).not.toBeInTheDocument();
  });

  it('shows a "no music to show" notice when every shelf is empty (no library access)', async () => {
    // Every source empty — a signed-in user with no music-library access.
    vi.mocked(getLatestAlbums).mockResolvedValue([]);
    vi.mocked(getSuggestedSongs).mockResolvedValue([]);
    vi.mocked(getRecentlyPlayed).mockResolvedValue([]);
    vi.mocked(getFavoriteAlbums).mockResolvedValue([]);
    vi.mocked(getFavoriteArtists).mockResolvedValue([]);
    renderWithProviders(<Home />);
    await waitFor(() => expect(screen.getByTestId('home-no-access')).toBeInTheDocument(), {
      timeout: 3000,
    });
    expect(screen.getByText(/can't see any music/i)).toBeInTheDocument();
    // The shelves (and their per-shelf empties) are replaced by the notice.
    expect(screen.queryByTestId('home-shelves')).not.toBeInTheDocument();
  });
});
