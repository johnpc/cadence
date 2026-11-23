import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./useChapters', () => ({
  useChapters: vi.fn(() => ({ chapters: [], isLoading: false })),
}));
vi.mock('../player/pendingSeek', () => ({ setPendingSeek: vi.fn() }));
import { setPendingSeek } from '../player/pendingSeek';
import { useBookProgress } from './useBookProgress';
import { PlayerContext } from '../player/PlayerContext';
import { PlayerProgressContext } from '../player/PlayerProgressContext';
import { stubPlayer } from '../../test/renderWithProviders';
import type { PlayerContextValue } from '../player/types';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const T = 10_000_000;
const part = (id: string, i: number, s: number): JellyfinItem =>
  ({
    Id: id,
    Name: 'Harbor Winds',
    Type: 'AudioBook',
    Album: 'Harbor Winds',
    IndexNumber: i,
    RunTimeTicks: s * T,
  }) as JellyfinItem;
const p1 = part('p1', 1, 200);
const p2 = part('p2', 2, 300);

function render(player: PlayerContextValue, position = 0, duration = 0) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <PlayerContext.Provider value={player}>
      <PlayerProgressContext.Provider value={{ position, duration, phase: 'known' }}>
        {children}
      </PlayerProgressContext.Provider>
    </PlayerContext.Provider>
  );
  return renderHook(() => useBookProgress(), { wrapper }).result.current;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('useBookProgress', () => {
  it('is null for music, and its seek is a no-op', () => {
    const player = stubPlayer({
      current: { Id: 's', Name: 'Song', Type: 'Audio' } as JellyfinItem,
    });
    const r = render(player);
    expect(r.model).toBeNull();
    r.seekBook(10);
    expect(player.seek).not.toHaveBeenCalled();
  });

  it('places the playing part in the queued book and seeks within it', () => {
    const player = stubPlayer({ current: p2, queue: [p1, p2], queueIndex: 1, rate: 1 });
    const r = render(player, 50, 300);
    expect(r.model?.book).toMatchObject({ position: 250, duration: 500 });
    expect(r.model?.chapter?.title).toBe('Part 2 of 2');
    r.seekBook(260);
    expect(player.seek).toHaveBeenCalledWith(60);
  });

  it('a target in another part jumps there and resumes at the right offset', () => {
    const player = stubPlayer({ current: p2, queue: [p1, p2], queueIndex: 1 });
    render(player, 50, 300).seekBook(120);
    expect(setPendingSeek).toHaveBeenCalledWith('p1', 120);
    expect(player.jumpTo).toHaveBeenCalledWith(0);
  });

  it('ignores a part that is no longer queued', () => {
    const player = stubPlayer({ current: p2, queue: [p2] });
    const r = render(player, 0, 300);
    r.seekBook(10);
    expect(player.seek).toHaveBeenCalledWith(10);
  });
});
