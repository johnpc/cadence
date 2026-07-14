import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({
  getFavoriteSongs: vi.fn().mockResolvedValue([]),
  getFavoriteAlbums: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../lib/jellyfinArtists', () => ({ getFavoriteArtists: vi.fn().mockResolvedValue([]) }));
vi.mock('../../lib/jellyfinPlaylists', () => ({
  getPlaylists: vi.fn().mockResolvedValue([]),
  createPlaylist: vi.fn(),
}));
import { getFavoriteSongs, getFavoriteAlbums } from '../../lib/jellyfinItems';
import { getFavoriteArtists } from '../../lib/jellyfinArtists';
import { getPlaylists } from '../../lib/jellyfinPlaylists';
import { Library } from './Library';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const song: JellyfinItem = { Id: 'l1', Name: 'Liked One', Type: 'Audio', Artists: ['A'] };
const playlist: JellyfinItem = { Id: 'p1', Name: 'Road Trip', Type: 'Playlist' };
const album: JellyfinItem = {
  Id: 'a1',
  Name: 'OK Computer',
  Type: 'MusicAlbum',
  AlbumArtist: 'RH',
};
const artist: JellyfinItem = { Id: 'ar1', Name: 'Radiohead', Type: 'MusicArtist' };

describe('Library', () => {
  beforeEach(() => {
    // Playlists/library lists now disk-cache; clear so one test's result can't
    // seed the next via initialData (e.g. the loading-skeleton test needs an
    // empty cache to actually see the skeleton).
    localStorage.clear();
    vi.mocked(getFavoriteSongs).mockResolvedValue([]);
    vi.mocked(getFavoriteAlbums).mockResolvedValue([]);
    vi.mocked(getFavoriteArtists).mockResolvedValue([]);
    vi.mocked(getPlaylists).mockResolvedValue([]);
  });
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('shows a settings link', () => {
    renderWithProviders(<Library />);
    expect(screen.getByTestId('library-settings')).toBeInTheDocument();
  });

  it('exposes a page heading for screen-reader navigation', () => {
    renderWithProviders(<Library />);
    expect(screen.getByRole('heading', { level: 1, name: 'Your Library' })).toBeInTheDocument();
  });

  it('shows a track-list skeleton while the library is loading', () => {
    vi.mocked(getPlaylists).mockReturnValue(new Promise(() => {})); // never resolves
    renderWithProviders(<Library />);
    expect(screen.getByTestId('skeleton-list')).toBeInTheDocument();
  });

  it('pins Liked Songs and lists playlists by default', async () => {
    vi.mocked(getFavoriteSongs).mockResolvedValue([song]);
    vi.mocked(getPlaylists).mockResolvedValue([playlist]);
    renderWithProviders(<Library />);
    await waitFor(() => expect(screen.getByText('Road Trip')).toBeInTheDocument());
    expect(screen.getByText('Liked Songs')).toBeInTheDocument();
  });

  it('opens the artists section directly from a ?filter=artists deep link', async () => {
    vi.mocked(getFavoriteArtists).mockResolvedValue([artist]);
    renderWithProviders(<Library />, { route: '/library?filter=artists' });
    // Lands on Artists (not the default Playlists) — the followed artist shows.
    await waitFor(() => expect(screen.getByText('Radiohead')).toBeInTheDocument());
  });

  it('switches to albums and artists via the filter pills', async () => {
    vi.mocked(getFavoriteAlbums).mockResolvedValue([album]);
    vi.mocked(getFavoriteArtists).mockResolvedValue([artist]);
    renderWithProviders(<Library />);
    await userEvent.click(screen.getByTestId('library-filter-albums'));
    await waitFor(() => expect(screen.getByText('OK Computer')).toBeInTheDocument());
    await userEvent.click(screen.getByTestId('library-filter-artists'));
    await waitFor(() => expect(screen.getByText('Radiohead')).toBeInTheDocument());
  });

  it('filters the library rows by the search text', async () => {
    vi.mocked(getFavoriteSongs).mockResolvedValue([song]);
    vi.mocked(getPlaylists).mockResolvedValue([playlist]);
    const { getByTestId, findByText, queryByText } = renderWithProviders(<Library />);
    await findByText('Road Trip');
    // Set the query directly (IonSearchbar debounce=0); userEvent.type can drop
    // chars into Ionic's wrapped input under jsdom.
    const bar = getByTestId('library-search');
    fireEvent(bar, new CustomEvent('ionInput', { detail: { value: 'road' } }));
    await waitFor(() => expect(queryByText('Liked Songs')).not.toBeInTheDocument());
    expect(queryByText('Road Trip')).toBeInTheDocument();
  });

  it('toggles alphabetical sort', async () => {
    vi.mocked(getFavoriteAlbums).mockResolvedValue([
      { Id: 'z', Name: 'Zebra', Type: 'MusicAlbum' },
      { Id: 'a', Name: 'Apple', Type: 'MusicAlbum' },
    ]);
    const { getByTestId, findByText } = renderWithProviders(<Library />);
    await userEvent.click(getByTestId('library-filter-albums'));
    await findByText('Zebra');
    const sort = getByTestId('library-sort');
    expect(sort).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(sort);
    await waitFor(() => expect(sort).toHaveAttribute('aria-pressed', 'true'));
    const names = getByTestId('library-list').querySelectorAll('.library-row__name');
    expect([...names].map((n) => n.textContent)).toEqual(['Apple', 'Zebra']);
  });
});
