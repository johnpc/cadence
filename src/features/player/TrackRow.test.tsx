import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  render(
    <PlayerContext.Provider value={player}>
      <TrackRow track={tracks[1]} queue={tracks} index={1} />
    </PlayerContext.Provider>,
  );
  expect(screen.getByText('Second')).toBeInTheDocument();
  await userEvent.click(screen.getByTestId('track-row'));
  expect(playQueue).toHaveBeenCalledWith(tracks, 1);
});
