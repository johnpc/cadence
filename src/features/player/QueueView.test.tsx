import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QueueView } from './QueueView';
import { setPlayContext } from './playContext';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

// Render IonModal children inline (jsdom can't run its framework delegate).
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonModal: ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) =>
      isOpen ? <div>{children}</div> : null,
  };
});

const queue: JellyfinItem[] = [
  { Id: 'a', Name: 'Queue A', Type: 'Audio' },
  { Id: 'b', Name: 'Queue B', Type: 'Audio' },
];

describe('QueueView', () => {
  afterEach(() => setPlayContext(null));

  it('shows the "Playing from" source when the current track has a context', () => {
    setPlayContext({ kind: 'playlist', label: 'Chill Mix', tracks: queue });
    renderWithProviders(<QueueView open onClose={vi.fn()} />, {
      player: stubPlayer({ queue, queueIndex: 0, current: queue[0] }),
    });
    expect(screen.getByTestId('queue-playing-from')).toHaveTextContent('Playing from playlist');
    expect(screen.getByTestId('queue-playing-from')).toHaveTextContent('Chill Mix');
  });

  it('shows no source line when there is no context', () => {
    renderWithProviders(<QueueView open onClose={vi.fn()} />, {
      player: stubPlayer({ queue, queueIndex: 0, current: queue[0] }),
    });
    expect(screen.queryByTestId('queue-playing-from')).not.toBeInTheDocument();
  });

  it('lists the queue and marks the current track', () => {
    renderWithProviders(<QueueView open onClose={vi.fn()} />, {
      player: stubPlayer({ queue, queueIndex: 1 }),
    });
    expect(screen.getByText('Queue A')).toBeInTheDocument();
    expect(screen.getByText('Queue B')).toBeInTheDocument();
    const rows = screen.getAllByTestId('queue-row');
    expect(rows[1].className).toContain('queueview__row--current');
  });

  it('splits into Now playing and Next up sections', () => {
    renderWithProviders(<QueueView open onClose={vi.fn()} />, {
      player: stubPlayer({ queue, queueIndex: 0 }),
    });
    expect(screen.getByText('Now playing')).toBeInTheDocument();
    expect(screen.getByText('Next up')).toBeInTheDocument();
  });

  it('omits Next up when the current track is last', () => {
    renderWithProviders(<QueueView open onClose={vi.fn()} />, {
      player: stubPlayer({ queue, queueIndex: 1 }),
    });
    expect(screen.getByText('Now playing')).toBeInTheDocument();
    expect(screen.queryByText('Next up')).not.toBeInTheDocument();
  });

  it('jumps to a track when tapped and closes', async () => {
    const jumpTo = vi.fn();
    const onClose = vi.fn();
    renderWithProviders(<QueueView open onClose={onClose} />, {
      player: stubPlayer({ queue, queueIndex: 0, jumpTo }),
    });
    await userEvent.click(screen.getAllByTestId('queue-row-play')[1]);
    expect(jumpTo).toHaveBeenCalledWith(1);
    expect(onClose).toHaveBeenCalled();
  });

  it('removes a track from the queue', async () => {
    const removeFromQueue = vi.fn();
    renderWithProviders(<QueueView open onClose={vi.fn()} />, {
      player: stubPlayer({ queue, queueIndex: 0, removeFromQueue }),
    });
    await userEvent.click(screen.getAllByTestId('queue-row-remove')[1]);
    expect(removeFromQueue).toHaveBeenCalledWith(1);
  });

  it('clears the upcoming queue when there is more to come', async () => {
    const clearQueue = vi.fn();
    renderWithProviders(<QueueView open onClose={vi.fn()} />, {
      player: stubPlayer({ queue, queueIndex: 0, clearQueue }),
    });
    await userEvent.click(screen.getByTestId('queue-clear'));
    expect(clearQueue).toHaveBeenCalledOnce();
  });

  it('hides Clear when the current track is last', () => {
    renderWithProviders(<QueueView open onClose={vi.fn()} />, {
      player: stubPlayer({ queue, queueIndex: 1 }),
    });
    expect(screen.queryByTestId('queue-clear')).not.toBeInTheDocument();
  });

  it('reorders a track down and disables the ends', async () => {
    const moveInQueue = vi.fn();
    renderWithProviders(<QueueView open onClose={vi.fn()} />, {
      player: stubPlayer({ queue, queueIndex: 0, moveInQueue }),
    });
    // First row cannot move up; last row cannot move down.
    expect(screen.getAllByTestId('queue-row-up')[0]).toBeDisabled();
    expect(screen.getAllByTestId('queue-row-down')[1]).toBeDisabled();
    await userEvent.click(screen.getAllByTestId('queue-row-down')[0]);
    expect(moveInQueue).toHaveBeenCalledWith(0, 1);
  });
});
