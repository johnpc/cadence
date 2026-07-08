import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TopResult } from './TopResult';
import { PlayerContext } from '../player/PlayerContext';
import { stubPlayer } from '../../test/renderWithProviders';
import type { PlayerContextValue } from '../player/types';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

function renderTop(item: JellyfinItem, player: PlayerContextValue = stubPlayer()) {
  return render(
    <PlayerContext.Provider value={player}>
      <MemoryRouter initialEntries={['/search']}>
        <TopResult item={item} onPick={vi.fn()} />
        <Route
          path="*"
          render={({ location }) => <span data-testid="loc">{location.pathname}</span>}
        />
      </MemoryRouter>
    </PlayerContext.Provider>,
  );
}

describe('TopResult', () => {
  it('plays a song top result', async () => {
    const playQueue = vi.fn();
    const song: JellyfinItem = { Id: 's', Name: 'Hit', Type: 'Audio', Artists: ['A'] };
    renderTop(song, stubPlayer({ playQueue }));
    expect(screen.getByText('Hit')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('top-result'));
    expect(playQueue).toHaveBeenCalledWith([song], 0);
  });

  it('navigates to an album / artist / playlist top result', async () => {
    renderTop({ Id: 'al', Name: 'Rec', Type: 'MusicAlbum' });
    await userEvent.click(screen.getByTestId('top-result'));
    expect(screen.getByTestId('loc')).toHaveTextContent('/album/al');

    renderTop({ Id: 'ar', Name: 'Band', Type: 'MusicArtist' });
    await userEvent.click(screen.getAllByTestId('top-result')[1]);
    expect(screen.getAllByTestId('loc')[1]).toHaveTextContent('/artist/ar');

    renderTop({ Id: 'pl', Name: 'Mix', Type: 'Playlist' });
    await userEvent.click(screen.getAllByTestId('top-result')[2]);
    expect(screen.getAllByTestId('loc')[2]).toHaveTextContent('/playlist/pl');
  });
});
