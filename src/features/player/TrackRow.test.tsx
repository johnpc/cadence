import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { TrackRow } from './TrackRow';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const tracks: JellyfinItem[] = [
  { Id: 'a', Name: 'First', Type: 'Audio', Artists: ['X'] },
  { Id: 'b', Name: 'Second', Type: 'Audio' },
];

it('plays the queue starting at the tapped track', async () => {
  const playQueue = vi.fn();
  renderWithProviders(<TrackRow track={tracks[1]} queue={tracks} index={1} />, {
    player: stubPlayer({ playQueue }),
  });
  expect(screen.getByText('Second')).toBeInTheDocument();
  await userEvent.click(screen.getByTestId('track-row-play'));
  expect(playQueue).toHaveBeenCalledWith(tracks, 1);
});

it('marks the currently-playing track', () => {
  renderWithProviders(<TrackRow track={tracks[0]} queue={tracks} index={0} />, {
    player: stubPlayer({ current: tracks[0], isPlaying: true }),
  });
  expect(screen.getByTestId('track-row').className).toContain('track-row--current');
});

it('does not mark a non-playing track', () => {
  renderWithProviders(<TrackRow track={tracks[1]} queue={tracks} index={1} />, {
    player: stubPlayer({ current: tracks[0], isPlaying: true }),
  });
  expect(screen.getByTestId('track-row').className).not.toContain('track-row--current');
});

it('shows a remove button (not the track menu) when onRemove is set', async () => {
  const onRemove = vi.fn();
  renderWithProviders(<TrackRow track={tracks[0]} queue={tracks} index={0} onRemove={onRemove} />);
  expect(screen.queryByTestId('add-to-playlist')).not.toBeInTheDocument();
  await userEvent.click(screen.getByTestId('track-row-remove'));
  expect(onRemove).toHaveBeenCalledOnce();
});
