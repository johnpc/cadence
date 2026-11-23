import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const seedRadio = vi.fn();
vi.mock('../player/useSeedRadio', () => ({ useSeedRadio: () => seedRadio }));
const toast = vi.fn();
vi.mock('../toast/useToast', () => ({ useToast: () => toast }));
const shareItem = vi.hoisted(() => vi.fn());
vi.mock('../share/shareLink', () => ({ shareItem }));
const addToQueue = vi.fn();
vi.mock('../player/usePlayer', () => ({ usePlayer: () => ({ addToQueue }) }));
import { AlbumMenu } from './AlbumMenu';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

// Render the action sheet's buttons inline (jsdom can't run Ionic's overlay).
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

const album: JellyfinItem = {
  Id: 'al1',
  Name: 'Great Album',
  Type: 'MusicAlbum',
  ArtistItems: [{ Id: 'ar1', Name: 'Band' }],
};

const tracks: JellyfinItem[] = [
  { Id: 't1', Name: 'One', Type: 'Audio' },
  { Id: 't2', Name: 'Two', Type: 'Audio' },
];

function renderMenu() {
  return render(
    <MemoryRouter initialEntries={['/album/al1']}>
      <AlbumMenu album={album} tracks={tracks} />
      <Route
        path="*"
        render={({ location }) => <span data-testid="loc">{location.pathname}</span>}
      />
    </MemoryRouter>,
  );
}

describe('AlbumMenu', () => {
  it('adds the album to the queue', async () => {
    renderMenu();
    await userEvent.click(screen.getByTestId('album-more'));
    await userEvent.click(screen.getByText('Add to queue'));
    expect(addToQueue).toHaveBeenCalledWith(tracks);
    expect(toast).toHaveBeenCalledWith('Added 2 songs to queue');
  });

  it('shares the album, toasting a copied link', async () => {
    shareItem.mockResolvedValueOnce('copied');
    renderMenu();
    await userEvent.click(screen.getByTestId('album-more'));
    await userEvent.click(screen.getByText('Share'));
    await vi.waitFor(() => expect(toast).toHaveBeenCalledWith('Link copied'));
    expect(shareItem).toHaveBeenCalledWith(album, window.location.origin);
  });

  it('starts an album radio seeded on the album', async () => {
    renderMenu();
    await userEvent.click(screen.getByTestId('album-more'));
    await userEvent.click(screen.getByText('Go to album radio'));
    expect(seedRadio).toHaveBeenCalledWith('al1');
    expect(toast).toHaveBeenCalledWith('Starting radio');
  });

  it('navigates to the artist', async () => {
    renderMenu();
    await userEvent.click(screen.getByTestId('album-more'));
    await userEvent.click(screen.getByText('Go to artist'));
    expect(screen.getByTestId('loc')).toHaveTextContent('/artist/ar1');
  });
});
