import { renderHook } from '@testing-library/react';
import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useWatchCommands } from './useWatchCommands';
import { WATCH_COMMAND_EVENT } from './watchTypes';

function actions() {
  return { toggle: vi.fn(), next: vi.fn(), prev: vi.fn(), seekBy: vi.fn() };
}
const fire = (evt: string) => act(() => window.dispatchEvent(new Event(evt)));

describe('useWatchCommands', () => {
  it('maps each watch event to the player action', () => {
    const a = actions();
    renderHook(() => useWatchCommands(a));
    fire(WATCH_COMMAND_EVENT.toggle);
    fire(WATCH_COMMAND_EVENT.next);
    fire(WATCH_COMMAND_EVENT.prev);
    expect(a.toggle).toHaveBeenCalledTimes(1);
    expect(a.next).toHaveBeenCalledTimes(1);
    expect(a.prev).toHaveBeenCalledTimes(1);
  });

  it('seeks forward/back by 15s', () => {
    const a = actions();
    renderHook(() => useWatchCommands(a));
    fire(WATCH_COMMAND_EVENT.seekForward);
    fire(WATCH_COMMAND_EVENT.seekBack);
    expect(a.seekBy).toHaveBeenNthCalledWith(1, 15);
    expect(a.seekBy).toHaveBeenNthCalledWith(2, -15);
  });

  it('removes listeners on unmount', () => {
    const a = actions();
    const { unmount } = renderHook(() => useWatchCommands(a));
    unmount();
    fire(WATCH_COMMAND_EVENT.toggle);
    expect(a.toggle).not.toHaveBeenCalled();
  });
});
