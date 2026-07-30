import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePlaybackControls } from './usePlaybackControls';
vi.mock('../../lib/diagnostics/diagnosticsStore', () => ({ log: vi.fn() }));

// Cast state is disconnected by default; the cast-branch tests flip it.
const castState = { connected: false };
vi.mock('../cast/castStore', () => ({ getCastState: () => castState }));
const castCtrl = { castToggle: vi.fn(), castSeek: vi.fn(), stopCast: vi.fn() };
vi.mock('../cast/castController', () => ({
  castToggle: (...a: unknown[]) => castCtrl.castToggle(...a),
  castSeek: (...a: unknown[]) => castCtrl.castSeek(...a),
  stopCast: () => castCtrl.stopCast(),
}));

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
  it('toggle plays when NOT playing (decides on isPlaying, not audio.paused)', () => {
    // audio.paused is false (the iOS post-interruption desync) but the UI shows
    // "play" (isPlaying=false) — the tap must PLAY, matching the button.
    const audio = fakeAudio(false);
    const { result } = renderHook(() =>
      usePlaybackControls({ current: audio }, true, false, vi.fn()),
    );
    result.current.toggle();
    expect(audio.play).toHaveBeenCalled();
    expect(audio.pause).not.toHaveBeenCalled();
  });

  it('toggle pauses when playing', () => {
    const audio = fakeAudio(false);
    const { result } = renderHook(() =>
      usePlaybackControls({ current: audio }, true, true, vi.fn()),
    );
    result.current.toggle();
    expect(audio.pause).toHaveBeenCalled();
    expect(audio.play).not.toHaveBeenCalled();
  });

  it('toggle is a no-op with an empty queue', () => {
    const audio = fakeAudio(true);
    const { result } = renderHook(() =>
      usePlaybackControls({ current: audio }, false, false, vi.fn()),
    );
    result.current.toggle();
    expect(audio.play).not.toHaveBeenCalled();
  });

  it('seek sets currentTime; pause pauses', () => {
    const audio = fakeAudio(false);
    const { result } = renderHook(() =>
      usePlaybackControls({ current: audio }, true, true, vi.fn()),
    );
    result.current.seek(42);
    expect(audio.currentTime).toBe(42);
    result.current.pause();
    expect(audio.pause).toHaveBeenCalled();
  });

  it('seekBy moves relative to the live position', () => {
    const audio = fakeAudio(false, 30);
    const { result } = renderHook(() =>
      usePlaybackControls({ current: audio }, true, true, vi.fn()),
    );
    result.current.seekBy(5);
    expect(audio.currentTime).toBe(35);
    result.current.seekBy(-10);
    expect(audio.currentTime).toBe(25);
  });

  it('seekBy clamps to [0, duration]', () => {
    const audio = fakeAudio(false, 2, 100);
    const { result } = renderHook(() =>
      usePlaybackControls({ current: audio }, true, true, vi.fn()),
    );
    result.current.seekBy(-5); // would be -3
    expect(audio.currentTime).toBe(0);
    audio.currentTime = 98;
    result.current.seekBy(5); // would be 103
    expect(audio.currentTime).toBe(100);
  });

  it('resume plays even when the element still reports NOT paused (the real interruption state)', () => {
    // After a Siri/call interruption iOS stops output at the session level, so
    // audio.paused stays false yet no sound plays — resume must call play()
    // anyway (guarding on .paused would no-op the exact broken case).
    const audio = fakeAudio(false);
    const { result } = renderHook(() =>
      usePlaybackControls({ current: audio }, true, true, vi.fn()),
    );
    result.current.resume();
    expect(audio.play).toHaveBeenCalled();
  });

  it('resume also plays when the element does report paused', () => {
    const audio = fakeAudio(true);
    const { result } = renderHook(() =>
      usePlaybackControls({ current: audio }, true, true, vi.fn()),
    );
    result.current.resume();
    expect(audio.play).toHaveBeenCalled();
  });

  it('resume is a no-op with an empty queue', () => {
    const audio = fakeAudio(true);
    const { result } = renderHook(() =>
      usePlaybackControls({ current: audio }, false, false, vi.fn()),
    );
    result.current.resume();
    expect(audio.play).not.toHaveBeenCalled();
  });

  it('stop tears down the element (pause + unsource) and empties the queue', () => {
    const audio = fakeAudio(false);
    audio.removeAttribute = vi.fn();
    audio.load = vi.fn();
    const emptyQueue = vi.fn();
    const { result } = renderHook(() =>
      usePlaybackControls({ current: audio }, true, true, emptyQueue),
    );
    result.current.stop();
    expect(audio.pause).toHaveBeenCalled();
    expect(audio.removeAttribute).toHaveBeenCalledWith('src');
    expect(emptyQueue).toHaveBeenCalledOnce();
  });

  it('stop also ends any TV cast, and empties the queue even with no audio element', () => {
    castState.connected = true;
    castCtrl.stopCast.mockResolvedValue(undefined);
    const emptyQueue = vi.fn();
    const { result } = renderHook(() =>
      usePlaybackControls({ current: null }, true, true, emptyQueue),
    );
    result.current.stop();
    expect(castCtrl.stopCast).toHaveBeenCalled();
    expect(emptyQueue).toHaveBeenCalledOnce();
    castState.connected = false;
  });

  it('toggle proxies to the cast receiver while connected', () => {
    castState.connected = true;
    castCtrl.castToggle.mockResolvedValue(undefined);
    const audio = fakeAudio(false);
    const { result } = renderHook(() =>
      usePlaybackControls({ current: audio }, true, false, vi.fn()),
    );
    result.current.toggle();
    expect(castCtrl.castToggle).toHaveBeenCalled();
    expect(audio.play).not.toHaveBeenCalled();
    castState.connected = false;
  });

  it('seek proxies to the cast receiver while connected', () => {
    castState.connected = true;
    castCtrl.castSeek.mockResolvedValue(undefined);
    const audio = fakeAudio(false);
    const { result } = renderHook(() =>
      usePlaybackControls({ current: audio }, true, true, vi.fn()),
    );
    result.current.seek(10);
    expect(castCtrl.castSeek).toHaveBeenCalledWith(10);
    castState.connected = false;
  });
});
