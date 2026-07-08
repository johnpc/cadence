import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PlayerContext } from './PlayerContext';
import { NowPlayingBar } from './NowPlayingBar';
import type { PlayerContextValue } from './types';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

// Render IonModal children inline (see FullPlayer.test for why).
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonModal: ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) =>
      isOpen ? <div>{children}</div> : null,
  };
});

function ctx(overrides: Partial<PlayerContextValue> = {}): PlayerContextValue {
  return {
    current: null,
    isPlaying: false,
    position: 0,
    duration: 0,
    shuffle: false,
    canNext: false,
    canPrev: false,
    playQueue: vi.fn(),
    toggle: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    seek: vi.fn(),
    toggleShuffle: vi.fn(),
    ...overrides,
  };
}

const song: JellyfinItem = { Id: 's1', Name: 'Test Song', Type: 'Audio', Artists: ['Tester'] };

const renderBar = (value: PlayerContextValue) =>
  render(<PlayerContext.Provider value={value}>{<NowPlayingBar />}</PlayerContext.Provider>);

describe('NowPlayingBar', () => {
  it('renders nothing when no track is playing', () => {
    renderBar(ctx());
    expect(screen.queryByTestId('now-playing-bar')).not.toBeInTheDocument();
  });

  it('shows the current track and toggles playback', async () => {
    const toggle = vi.fn();
    renderBar(ctx({ current: song, toggle }));
    expect(screen.getByTestId('now-playing-title')).toHaveTextContent('Test Song');
    await userEvent.click(screen.getByTestId('now-playing-toggle'));
    expect(toggle).toHaveBeenCalledOnce();
  });

  it('opens the full player when the bar is tapped', async () => {
    renderBar(ctx({ current: song }));
    await userEvent.click(screen.getByTestId('now-playing-open'));
    expect(await screen.findByTestId('full-player')).toBeInTheDocument();
  });
});
