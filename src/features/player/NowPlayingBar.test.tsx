import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { NowPlayingBar } from './NowPlayingBar';
import type { PlayerContextValue } from './types';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';

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
  return stubPlayer(overrides);
}

const song: JellyfinItem = { Id: 's1', Name: 'Test Song', Type: 'Audio', Artists: ['Tester'] };

const renderBar = (value: PlayerContextValue) =>
  renderWithProviders(<NowPlayingBar />, { player: value });

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

  it('reflects playback progress as a fill width', () => {
    renderBar(ctx({ current: song, position: 30, duration: 120 }));
    const fill = screen.getByTestId('now-playing-progress').querySelector('.npbar__progress-fill');
    expect((fill as HTMLElement).style.width).toBe('25%');
  });
});
