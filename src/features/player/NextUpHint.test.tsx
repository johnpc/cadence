import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NextUpHint } from './NextUpHint';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const q: JellyfinItem[] = [
  { Id: 'a', Name: 'Now', Type: 'Audio', Artists: ['Band A'] },
  { Id: 'b', Name: 'Coming Up', Type: 'Audio', Artists: ['Band B'] },
];

describe('NextUpHint', () => {
  it('shows the next queued track and its artist', () => {
    renderWithProviders(<NextUpHint onOpenQueue={vi.fn()} />, {
      player: stubPlayer({ queue: q, queueIndex: 0 }),
    });
    const hint = screen.getByTestId('full-player-next-up');
    expect(hint).toHaveTextContent('Coming Up');
    expect(hint).toHaveTextContent('Band B');
  });

  it('opens the queue when tapped', async () => {
    const onOpenQueue = vi.fn();
    renderWithProviders(<NextUpHint onOpenQueue={onOpenQueue} />, {
      player: stubPlayer({ queue: q, queueIndex: 0 }),
    });
    await userEvent.click(screen.getByTestId('full-player-next-up'));
    expect(onOpenQueue).toHaveBeenCalledOnce();
  });

  it('renders nothing when the current track is last in the queue', () => {
    renderWithProviders(<NextUpHint onOpenQueue={vi.fn()} />, {
      player: stubPlayer({ queue: q, queueIndex: 1 }),
    });
    expect(screen.queryByTestId('full-player-next-up')).not.toBeInTheDocument();
  });

  it('renders nothing with an empty queue', () => {
    renderWithProviders(<NextUpHint onOpenQueue={vi.fn()} />, {
      player: stubPlayer({ queue: [], queueIndex: 0 }),
    });
    expect(screen.queryByTestId('full-player-next-up')).not.toBeInTheDocument();
  });
});
