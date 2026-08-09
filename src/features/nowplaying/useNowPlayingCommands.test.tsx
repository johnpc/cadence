import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useNowPlayingCommands } from './useNowPlayingCommands';
import { NOW_PLAYING_EVENT, NOW_PLAYING_SEEK_EVENT } from './nowPlayingTypes';

function actions() {
  return { play: vi.fn(), pause: vi.fn(), next: vi.fn(), prev: vi.fn(), seek: vi.fn() };
}
const fire = (evt: string) => act(() => window.dispatchEvent(new Event(evt)));

describe('useNowPlayingCommands', () => {
  it('maps each remote event to the matching player action', () => {
    const a = actions();
    renderHook(() => useNowPlayingCommands(a));
    fire(NOW_PLAYING_EVENT.play);
    fire(NOW_PLAYING_EVENT.pause);
    fire(NOW_PLAYING_EVENT.next);
    fire(NOW_PLAYING_EVENT.prev);
    expect(a.play).toHaveBeenCalledTimes(1);
    expect(a.pause).toHaveBeenCalledTimes(1);
    expect(a.next).toHaveBeenCalledTimes(1);
    expect(a.prev).toHaveBeenCalledTimes(1);
  });

  it('seeks to the absolute seconds carried in the seek event detail', () => {
    const a = actions();
    renderHook(() => useNowPlayingCommands(a));
    act(() => {
      window.dispatchEvent(new CustomEvent(NOW_PLAYING_SEEK_EVENT, { detail: 42 }));
    });
    expect(a.seek).toHaveBeenCalledWith(42);
  });

  it('ignores a seek event without a numeric detail', () => {
    const a = actions();
    renderHook(() => useNowPlayingCommands(a));
    act(() => {
      window.dispatchEvent(new CustomEvent(NOW_PLAYING_SEEK_EVENT, { detail: undefined }));
    });
    expect(a.seek).not.toHaveBeenCalled();
  });

  it('removes listeners on unmount', () => {
    const a = actions();
    const { unmount } = renderHook(() => useNowPlayingCommands(a));
    unmount();
    fire(NOW_PLAYING_EVENT.play);
    expect(a.play).not.toHaveBeenCalled();
  });
});
