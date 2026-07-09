import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { NowPlayingBar } from './NowPlayingBar';
import type { PlayerContextValue } from './types';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';

vi.mock('../../lib/jellyfinLyrics', () => ({ getLyrics: vi.fn().mockResolvedValue([]) }));

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

const renderBar = (value: PlayerContextValue, progress?: { position: number; duration: number }) =>
  renderWithProviders(<NowPlayingBar />, { player: value, progress });

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

  it('shows a buffering spinner (not the play/pause icon) while waiting', () => {
    renderBar(ctx({ current: song, isPlaying: true, waiting: true }));
    expect(screen.getByTestId('now-playing-buffering')).toBeInTheDocument();
  });

  it('offers a like toggle for the current track', () => {
    renderBar(ctx({ current: song }));
    expect(screen.getByTestId('like-button')).toBeInTheDocument();
  });

  it('opens the full player when the bar is tapped', async () => {
    renderBar(ctx({ current: song }));
    await userEvent.click(screen.getByTestId('now-playing-open'));
    expect(await screen.findByTestId('full-player')).toBeInTheDocument();
  });

  it('reflects playback progress as a fill width', () => {
    renderBar(ctx({ current: song }), { position: 30, duration: 120 });
    const fill = screen.getByTestId('now-playing-progress').querySelector('.npbar__progress-fill');
    expect((fill as HTMLElement).style.width).toBe('25%');
  });

  it('seeks once on release after dragging the progress bar', () => {
    const seek = vi.fn();
    renderBar(ctx({ current: song, seek }), { position: 30, duration: 120 });
    const bar = screen.getByTestId('now-playing-seek');
    // Drag steps fire React's onChange (no seek yet); release commits one seek.
    fireEvent.change(bar, { target: { value: '60' } });
    fireEvent.change(bar, { target: { value: '90' } });
    expect(seek).not.toHaveBeenCalled();
    fireEvent.pointerUp(bar);
    expect(seek).toHaveBeenCalledTimes(1);
    expect(seek).toHaveBeenCalledWith(90);
  });

  it('exposes desktop extras: mute toggles volume to 0 and back', async () => {
    const setVolume = vi.fn();
    renderBar(ctx({ current: song, volume: 0.8, setVolume }));
    expect(screen.getByTestId('now-playing-extras')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('npbar-mute'));
    expect(setVolume).toHaveBeenCalledWith(0);
  });

  it('unmutes back to the previous volume', async () => {
    const setVolume = vi.fn();
    renderBar(ctx({ current: song, volume: 0, setVolume }));
    await userEvent.click(screen.getByTestId('npbar-mute'));
    expect(setVolume).toHaveBeenCalledWith(1);
  });
});
