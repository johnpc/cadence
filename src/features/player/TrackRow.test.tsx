import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { TrackRow } from './TrackRow';
import { getPlayContext, setPlayContext } from './playContext';
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

it('records the "Playing from" context when a row with a context is played', async () => {
  setPlayContext(null);
  renderWithProviders(
    <TrackRow
      track={tracks[1]}
      queue={tracks}
      index={1}
      context={{ kind: 'album', label: 'Ren' }}
    />,
    { player: stubPlayer({ playQueue: vi.fn() }) },
  );
  await userEvent.click(screen.getByTestId('track-row-play'));
  const ctx = getPlayContext();
  expect(ctx?.kind).toBe('album');
  expect(ctx?.label).toBe('Ren');
  expect([...(ctx?.trackIds ?? [])]).toEqual(['a', 'b']);
  setPlayContext(null);
});

it('leaves the context untouched when a row has no context (e.g. search)', async () => {
  setPlayContext(null);
  renderWithProviders(<TrackRow track={tracks[1]} queue={tracks} index={1} />, {
    player: stubPlayer({ playQueue: vi.fn() }),
  });
  await userEvent.click(screen.getByTestId('track-row-play'));
  expect(getPlayContext()).toBeNull();
});

it('toggles playback (does not restart) when the current row is tapped', async () => {
  const playQueue = vi.fn();
  const toggle = vi.fn();
  renderWithProviders(<TrackRow track={tracks[0]} queue={tracks} index={0} />, {
    player: stubPlayer({ current: tracks[0], isPlaying: true, playQueue, toggle }),
  });
  await userEvent.click(screen.getByTestId('track-row-play'));
  expect(toggle).toHaveBeenCalled();
  expect(playQueue).not.toHaveBeenCalled();
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

it('always renders a single "…" menu as the only trailing control', () => {
  // All row actions (like, download, remove, reorder) live in the menu now, so
  // the row itself has just the one trailing button — no matter the props.
  renderWithProviders(<TrackRow track={tracks[0]} queue={tracks} index={0} onRemove={vi.fn()} />);
  expect(screen.getByTestId('add-to-playlist')).toBeInTheDocument();
  // The old inline controls are gone from the row.
  expect(screen.queryByTestId('track-row-remove')).not.toBeInTheDocument();
  expect(screen.queryByTestId('track-row-up')).not.toBeInTheDocument();
  expect(screen.queryByTestId('like-button')).not.toBeInTheDocument();
  expect(screen.queryByTestId('download-button')).not.toBeInTheDocument();
});

it('shows the track duration when the run time is known', () => {
  const withTime: JellyfinItem = { ...tracks[0], RunTimeTicks: 75 * 10_000_000 };
  renderWithProviders(<TrackRow track={withTime} queue={[withTime]} index={0} />);
  expect(screen.getByTestId('track-duration')).toHaveTextContent('1:15');
});

it('shows the track number instead of art when showNumber is set', () => {
  const numbered: JellyfinItem = { ...tracks[0], IndexNumber: 4 };
  renderWithProviders(<TrackRow track={numbered} queue={[numbered]} index={0} showNumber />);
  expect(screen.getByTestId('track-number')).toHaveTextContent('4');
});
