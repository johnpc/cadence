import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../playlists/playlistsApi', () => ({
  usePlaylists: () => ({ playlists: [{ Id: 'pl1', Name: 'Chill' }] }),
  useAddToPlaylist: () => ({ mutate: vi.fn() }),
}));
vi.mock('../playlists/playlistCreate', () => ({
  useCreatePlaylistWithItems: () => ({ mutate: vi.fn() }),
}));
vi.mock('./usePlayItem', () => ({ usePlayItem: () => vi.fn() }));
import { NowPlayingMenu } from './NowPlayingMenu';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

// Render the action sheet's buttons inline as clickable rows (jsdom can't run
// Ionic's overlay), so we can assert navigation from a menu choice.
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

const track: JellyfinItem = {
  Id: 't1',
  Name: 'x',
  Type: 'Audio',
  AlbumId: 'al1',
  ArtistItems: [{ Id: 'ar1', Name: 'Band' }],
};

function renderMenu(onNavigate = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <NowPlayingMenu track={track} onNavigate={onNavigate} />
      <Route
        path="*"
        render={({ location }) => <span data-testid="loc">{location.pathname}</span>}
      />
    </MemoryRouter>,
  );
}

describe('NowPlayingMenu', () => {
  it('navigates to the album and closes the player', async () => {
    const onNavigate = vi.fn();
    renderMenu(onNavigate);
    await userEvent.click(screen.getByTestId('full-player-more'));
    await userEvent.click(screen.getByText('Go to album'));
    expect(screen.getByTestId('loc')).toHaveTextContent('/album/al1');
    expect(onNavigate).toHaveBeenCalled();
  });

  it('navigates to the artist', async () => {
    renderMenu();
    await userEvent.click(screen.getByTestId('full-player-more'));
    await userEvent.click(screen.getByText('Go to artist'));
    expect(screen.getByTestId('loc')).toHaveTextContent('/artist/ar1');
  });

  it('reveals each playlist as an add target via the "Add to playlist…" picker', async () => {
    renderMenu();
    await userEvent.click(screen.getByTestId('full-player-more'));
    // The primary menu no longer inlines playlists — it opens a dedicated sheet.
    expect(screen.queryByText('Add to Chill')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Add to playlist…'));
    expect(screen.getByText('Chill')).toBeInTheDocument();
  });

  it('offers "New playlist…" before the existing playlists in the picker', async () => {
    renderMenu();
    await userEvent.click(screen.getByTestId('full-player-more'));
    await userEvent.click(screen.getByText('Add to playlist…'));
    const labels = screen.getAllByRole('button').map((b) => b.textContent);
    expect(labels).toContain('New playlist…');
    expect(labels.indexOf('New playlist…')).toBeLessThan(labels.indexOf('Chill'));
  });
});
