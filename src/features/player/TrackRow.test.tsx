import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { PlayerContext } from './PlayerContext';
import { TrackRow } from './TrackRow';
import type { PlayerContextValue } from './types';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const tracks: JellyfinItem[] = [
  { Id: 'a', Name: 'First', Type: 'Audio', Artists: ['X'] },
  { Id: 'b', Name: 'Second', Type: 'Audio' },
];

it('plays the queue starting at the tapped track', async () => {
  const playQueue = vi.fn();
  const player = { playQueue } as unknown as PlayerContextValue;
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <PlayerContext.Provider value={player}>
        <TrackRow track={tracks[1]} queue={tracks} index={1} />
      </PlayerContext.Provider>
    </QueryClientProvider>,
  );
  expect(screen.getByText('Second')).toBeInTheDocument();
  await userEvent.click(screen.getByTestId('track-row-play'));
  expect(playQueue).toHaveBeenCalledWith(tracks, 1);
});
