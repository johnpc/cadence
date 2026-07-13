import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Row actions live in the "…" menu (an IonActionSheet). Render its buttons
// inline so the remove-from-playlist path is clickable in jsdom.
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonActionSheet: ({
      isOpen,
      buttons,
    }: {
      isOpen: boolean;
      buttons: { text: string; handler?: () => void }[];
    }) =>
      isOpen ? (
        <div>
          {buttons.map((b) => (
            <button key={b.text} onClick={b.handler}>
              {b.text}
            </button>
          ))}
        </div>
      ) : null,
  };
});

vi.mock('../../lib/jellyfinPlaylists', () => ({
  getPlaylistItems: vi.fn(),
  getPlaylists: vi.fn().mockResolvedValue([]),
  createPlaylist: vi.fn(),
  addToPlaylist: vi.fn(),
  removeFromPlaylist: vi.fn(),
  movePlaylistItem: vi.fn(),
  deletePlaylist: vi.fn(),
  getPlaylistIsPublic: vi.fn().mockResolvedValue(false),
  setPlaylistIsPublic: vi.fn(),
}));
vi.mock('../../lib/jellyfinItems', () => ({
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  getItem: vi
    .fn()
    .mockResolvedValue({ Id: 'p1', Name: 'My Playlist', Type: 'Playlist', CanDelete: true }),
}));
import { getPlaylistItems } from '../../lib/jellyfinPlaylists';
import { getItem } from '../../lib/jellyfinItems';
import { PlaylistDetail } from './PlaylistDetail';
import { PlayerContext } from '../player/PlayerContext';
import { stubPlayer } from '../../test/renderWithProviders';
import type { PlayerContextValue } from '../player/types';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const tracks: JellyfinItem[] = [
  { Id: 'a', Name: 'PL Track A', Type: 'Audio', Artists: ['X'] },
  { Id: 'b', Name: 'PL Track B', Type: 'Audio' },
];

function renderDetail(player: PlayerContextValue = stubPlayer()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PlayerContext.Provider value={player}>
        <MemoryRouter initialEntries={['/playlist/p1']}>
          <Route path="/playlist/:id">
            <PlaylistDetail />
          </Route>
        </MemoryRouter>
      </PlayerContext.Provider>
    </QueryClientProvider>,
  );
}

describe('PlaylistDetail', () => {
  beforeEach(() => {
    vi.mocked(getItem).mockResolvedValue({
      Id: 'p1',
      Name: 'My Playlist',
      Type: 'Playlist',
      CanDelete: true,
    });
  });
  afterEach(() => {
    vi.resetAllMocks();
    // usePlaylistItems persists to localStorage; clear it so one test's tracks
    // don't seed the next test's query via initialData.
    localStorage.clear();
  });

  it('renders the playlist tracks', async () => {
    vi.mocked(getPlaylistItems).mockResolvedValue(tracks);
    renderDetail();
    expect(await screen.findByText('PL Track A')).toBeInTheDocument();
    expect(getPlaylistItems).toHaveBeenCalledWith('p1');
  });

  it('shows the playlist name in the header', async () => {
    vi.mocked(getPlaylistItems).mockResolvedValue(tracks);
    renderDetail();
    expect(await screen.findByText('My Playlist')).toBeInTheDocument();
  });

  it('shows the playlist description when present', async () => {
    vi.mocked(getItem).mockResolvedValue({
      Id: 'p1',
      Name: 'My Playlist',
      Type: 'Playlist',
      Overview: 'Songs for a long drive.',
    });
    vi.mocked(getPlaylistItems).mockResolvedValue(tracks);
    renderDetail();
    expect(await screen.findByTestId('playlist-desc')).toHaveTextContent('Songs for a long drive.');
  });

  it('plays the whole playlist from the top', async () => {
    vi.mocked(getPlaylistItems).mockResolvedValue(tracks);
    const playQueue = vi.fn();
    renderDetail(stubPlayer({ playQueue }));
    await userEvent.click(await screen.findByTestId('play-all'));
    expect(playQueue).toHaveBeenCalledWith(tracks, 0);
  });

  it('shows an empty state for an empty playlist', async () => {
    vi.mocked(getPlaylistItems).mockResolvedValue([]);
    renderDetail();
    await waitFor(() => expect(screen.getByTestId('load-empty')).toBeInTheDocument());
  });

  it('offers a delete-playlist action', async () => {
    vi.mocked(getPlaylistItems).mockResolvedValue(tracks);
    renderDetail();
    expect(await screen.findByTestId('delete-playlist')).toBeInTheDocument();
  });

  it('removes a track via its remove button', async () => {
    const withEntry: JellyfinItem[] = [{ ...tracks[0], PlaylistItemId: 'e1' }];
    vi.mocked(getPlaylistItems).mockResolvedValue(withEntry);
    const { removeFromPlaylist } = await import('../../lib/jellyfinPlaylists');
    vi.mocked(removeFromPlaylist).mockResolvedValue();
    renderDetail();
    // Open the row's "…" menu, then tap "Remove from this playlist".
    await userEvent.click((await screen.findAllByTestId('add-to-playlist'))[0]);
    await userEvent.click(await screen.findByText('Remove from this playlist'));
    expect(removeFromPlaylist).toHaveBeenCalledWith('p1', 'e1');
  });

  it('for a playlist you do NOT own, offers Clone and hides delete + track-remove', async () => {
    vi.mocked(getItem).mockResolvedValue({
      Id: 'p1',
      Name: 'Community Mix',
      Type: 'Playlist',
      CanDelete: false,
    });
    vi.mocked(getPlaylistItems).mockResolvedValue([{ ...tracks[0], PlaylistItemId: 'e1' }]);
    renderDetail();
    expect(await screen.findByTestId('clone-playlist')).toBeInTheDocument();
    expect(screen.queryByTestId('delete-playlist')).not.toBeInTheDocument();
    // The row menu has no "Remove from this playlist" for a playlist you can't edit.
    await userEvent.click((await screen.findAllByTestId('add-to-playlist'))[0]);
    expect(screen.queryByText('Remove from this playlist')).not.toBeInTheDocument();
  });
});
