import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePlaybackControls } from './usePlaybackControls';

function fakeAudio(paused: boolean) {
  return {
    paused,
    currentTime: 0,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
  } as unknown as HTMLAudioElement;
}

describe('usePlaybackControls', () => {
  it('toggle plays when paused', () => {
    const audio = fakeAudio(true);
    const { result } = renderHook(() => usePlaybackControls({ current: audio }, true));
    result.current.toggle();
    expect(audio.play).toHaveBeenCalled();
  });

  it('toggle pauses when playing', () => {
    const audio = fakeAudio(false);
    const { result } = renderHook(() => usePlaybackControls({ current: audio }, true));
    result.current.toggle();
    expect(audio.pause).toHaveBeenCalled();
  });

  it('toggle is a no-op with an empty queue', () => {
    const audio = fakeAudio(true);
    const { result } = renderHook(() => usePlaybackControls({ current: audio }, false));
    result.current.toggle();
    expect(audio.play).not.toHaveBeenCalled();
  });

  it('seek sets currentTime; pause pauses', () => {
    const audio = fakeAudio(false);
    const { result } = renderHook(() => usePlaybackControls({ current: audio }, true));
    result.current.seek(42);
    expect(audio.currentTime).toBe(42);
    result.current.pause();
    expect(audio.pause).toHaveBeenCalled();
  });
});
