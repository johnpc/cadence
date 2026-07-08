import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useVolume } from './useVolume';

function audioRef(): { current: HTMLAudioElement } {
  return { current: { volume: 1 } as HTMLAudioElement };
}

describe('useVolume', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('defaults to full volume and applies it to the element', () => {
    const ref = audioRef();
    const { result } = renderHook(() => useVolume(ref, 't1'));
    expect(result.current.volume).toBe(1);
    expect(ref.current.volume).toBe(1);
  });

  it('sets, clamps, and persists the volume', () => {
    const ref = audioRef();
    const { result } = renderHook(() => useVolume(ref, 't1'));
    act(() => result.current.setVolume(0.5));
    expect(result.current.volume).toBe(0.5);
    expect(ref.current.volume).toBe(0.5);
    expect(localStorage.getItem('cadence.volume')).toBe('0.5');
    act(() => result.current.setVolume(2));
    expect(result.current.volume).toBe(1); // clamped
  });

  it('restores the persisted volume on mount', () => {
    localStorage.setItem('cadence.volume', '0.3');
    const { result } = renderHook(() => useVolume(audioRef(), 't1'));
    expect(result.current.volume).toBe(0.3);
  });
});
