import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAudioElement } from './useAudioElement';

class FakeAudio {
  parentNode = document.body;
  setAttribute() {}
  currentTime = 12;
  duration = 240;
  private handlers: Record<string, Array<() => void>> = {};
  addEventListener(type: string, fn: () => void) {
    (this.handlers[type] ??= []).push(fn);
  }
  removeEventListener() {}
  fire(type: string) {
    (this.handlers[type] ?? []).forEach((fn) => fn());
  }
}

let audio: FakeAudio;

describe('useAudioElement', () => {
  beforeEach(() => {
    audio = new FakeAudio();
    vi.stubGlobal(
      'Audio',
      vi.fn(() => audio),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('tracks play/pause, position, duration, and fires onEnded', () => {
    const onEnded = vi.fn();
    const { result } = renderHook(() => useAudioElement(onEnded));
    expect(result.current.isPlaying).toBe(false);

    act(() => audio.fire('play'));
    expect(result.current.isPlaying).toBe(true);
    act(() => audio.fire('pause'));
    expect(result.current.isPlaying).toBe(false);

    act(() => audio.fire('timeupdate'));
    expect(result.current.position).toBe(12);
    act(() => audio.fire('loadedmetadata'));
    expect(result.current.duration).toBe(240);

    act(() => audio.fire('ended'));
    expect(onEnded).toHaveBeenCalledOnce();
  });
});
