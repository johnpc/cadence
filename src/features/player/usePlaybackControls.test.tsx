import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePlaybackControls } from './usePlaybackControls';

function fakeAudio(paused: boolean, currentTime = 0, duration = 100) {
  return {
    paused,
    currentTime,
    duration,
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

  it('seekBy moves relative to the live position', () => {
    const audio = fakeAudio(false, 30);
    const { result } = renderHook(() => usePlaybackControls({ current: audio }, true));
    result.current.seekBy(5);
    expect(audio.currentTime).toBe(35);
    result.current.seekBy(-10);
    expect(audio.currentTime).toBe(25);
  });

  it('seekBy clamps to [0, duration]', () => {
    const audio = fakeAudio(false, 2, 100);
    const { result } = renderHook(() => usePlaybackControls({ current: audio }, true));
    result.current.seekBy(-5); // would be -3
    expect(audio.currentTime).toBe(0);
    audio.currentTime = 98;
    result.current.seekBy(5); // would be 103
    expect(audio.currentTime).toBe(100);
  });
});
