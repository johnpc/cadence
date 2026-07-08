import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FullPlayer } from './FullPlayer';
import type { PlayerContextValue } from './types';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';

// The lyrics sheet fetches lazily when opened; stub the source so no real
// network fires from this render.
vi.mock('../../lib/jellyfinLyrics', () => ({ getLyrics: vi.fn().mockResolvedValue([]) }));

// IonModal's real present/dismiss uses a "framework delegate" that jsdom can't
// satisfy; render its children inline when open so we test our content only.
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonModal: ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) =>
      isOpen ? <div>{children}</div> : null,
  };
});

const song: JellyfinItem = { Id: 's1', Name: 'Full Song', Type: 'Audio', Artists: ['Band'] };

function ctx(overrides: Partial<PlayerContextValue> = {}): PlayerContextValue {
  return stubPlayer({
    current: song,
    isPlaying: true,
    position: 30,
    duration: 200,
    canNext: true,
    canPrev: true,
    ...overrides,
  });
}

const renderPlayer = (value: PlayerContextValue) =>
  renderWithProviders(<FullPlayer open onClose={vi.fn()} />, { player: value });

describe('FullPlayer', () => {
  it('shows the current track and transport controls', async () => {
    renderPlayer(ctx());
    expect(screen.getByText('Full Song')).toBeInTheDocument();
    expect(screen.getByText('Band')).toBeInTheDocument();
  });

  it('drives play, next, prev, and shuffle', async () => {
    const toggle = vi.fn();
    const next = vi.fn();
    const prev = vi.fn();
    const toggleShuffle = vi.fn();
    renderPlayer(ctx({ toggle, next, prev, toggleShuffle }));
    await userEvent.click(screen.getByTestId('full-player-toggle'));
    await userEvent.click(screen.getByTestId('full-player-next'));
    await userEvent.click(screen.getByTestId('full-player-prev'));
    await userEvent.click(screen.getByTestId('full-player-shuffle'));
    expect(toggle).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledOnce();
    expect(prev).toHaveBeenCalledOnce();
    expect(toggleShuffle).toHaveBeenCalledOnce();
  });

  it('renders the position and duration times', async () => {
    renderPlayer(ctx({ position: 30, duration: 200 }));
    expect(screen.getByText('0:30')).toBeInTheDocument();
    expect(screen.getByText('3:20')).toBeInTheDocument();
  });

  it('cycles repeat and opens the queue', async () => {
    const cycleRepeat = vi.fn();
    renderPlayer(ctx({ cycleRepeat, repeat: 'one' }));
    await userEvent.click(screen.getByTestId('full-player-repeat'));
    expect(cycleRepeat).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByTestId('full-player-queue'));
    expect(await screen.findByTestId('queue-view')).toBeInTheDocument();
  });

  it('adjusts volume via the slider', async () => {
    const setVolume = vi.fn();
    renderPlayer(ctx({ volume: 1, setVolume }));
    const slider = screen.getByTestId('full-player-volume');
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(slider, { target: { value: '0.4' } });
    expect(setVolume).toHaveBeenCalledWith(0.4);
  });

  it('opens the lyrics sheet', async () => {
    renderPlayer(ctx());
    await userEvent.click(screen.getByTestId('full-player-lyrics'));
    expect(await screen.findByTestId('lyrics-sheet')).toBeInTheDocument();
  });
});
