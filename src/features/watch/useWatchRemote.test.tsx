import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./useWatchSync', () => ({ useWatchSync: vi.fn() }));
vi.mock('./useWatchCommands', () => ({ useWatchCommands: vi.fn() }));
import { useWatchSync } from './useWatchSync';
import { useWatchCommands } from './useWatchCommands';
import { useWatchRemote } from './useWatchRemote';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = { Id: 't', Name: 'S', Type: 'Audio' } as JellyfinItem;

describe('useWatchRemote', () => {
  it('wires sync with now-playing state and commands with the actions', () => {
    const toggle = vi.fn(),
      next = vi.fn(),
      prev = vi.fn(),
      seekBy = vi.fn();
    renderHook(() =>
      useWatchRemote({
        current: track,
        isPlaying: true,
        position: 5,
        duration: 100,
        toggle,
        seekBy,
        next,
        prev,
      }),
    );
    expect(useWatchSync).toHaveBeenCalledWith(track, true, 5, 100);
    expect(useWatchCommands).toHaveBeenCalledWith({ toggle, next, prev, seekBy });
  });
});
