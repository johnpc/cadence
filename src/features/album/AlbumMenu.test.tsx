import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const seedRadio = vi.fn();
vi.mock('../player/useSeedRadio', () => ({ useSeedRadio: () => seedRadio }));
const toast = vi.fn();
vi.mock('../toast/useToast', () => ({ useToast: () => toast }));
vi.mock('../share/shareLink', () => ({ copyShareLink: vi.fn().mockResolvedValue(true) }));
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

function renderMenu() {
  return render(
    <MemoryRouter initialEntries={['/album/al1']}>
      <AlbumMenu album={album} />
      <Route
        path="*"
        render={({ location }) => <span data-testid="loc">{location.pathname}</span>}
      />
    </MemoryRouter>,
  );
}

describe('AlbumMenu', () => {
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
