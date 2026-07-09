import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { AlbumTracks } from './AlbumTracks';
import { PlayerContext } from '../player/PlayerContext';
import { stubPlayer } from '../../test/renderWithProviders';
import type { PlayerContextValue } from '../player/types';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const t = (id: string, name: string, disc?: number): JellyfinItem => ({
  Id: id,
  Name: name,
  Type: 'Audio',
  ParentIndexNumber: disc,
  IndexNumber: 1,
});

function renderTracks(tracks: JellyfinItem[], player: PlayerContextValue = stubPlayer()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PlayerContext.Provider value={player}>
        <MemoryRouter>
          <AlbumTracks tracks={tracks} />
        </MemoryRouter>
      </PlayerContext.Provider>
    </QueryClientProvider>,
  );
}

describe('AlbumTracks', () => {
  it('renders a flat list with no disc headers for a single-disc album', () => {
    renderTracks([t('a', 'One', 1), t('b', 'Two', 1)]);
    expect(screen.queryByTestId('album-disc-heading')).not.toBeInTheDocument();
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
  });

  it('renders "Disc N" headers for a multi-disc album', () => {
    renderTracks([t('a', 'One', 1), t('b', 'Two', 1), t('c', 'Three', 2)]);
    const headings = screen.getAllByTestId('album-disc-heading').map((h) => h.textContent);
    expect(headings).toEqual(['Disc 1', 'Disc 2']);
  });

  it('plays the whole album (flat index), even when starting from a later disc', async () => {
    const player = stubPlayer();
    const tracks = [t('a', 'One', 1), t('b', 'Two', 1), t('c', 'Three', 2)];
    renderTracks(tracks, player);
    // "Three" is the first track of disc 2 but index 2 in the flat album queue.
    await userEvent.click(screen.getAllByTestId('track-row-play')[2]);
    expect(player.playQueue).toHaveBeenCalledWith(tracks, 2);
  });
});
