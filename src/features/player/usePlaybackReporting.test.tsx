import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinPlayback', () => ({
  beaconPlaybackPosition: vi.fn(),
  reportPlaybackStart: vi.fn(),
  reportPlaybackProgress: vi.fn(),
  reportPlaybackStopped: vi.fn(),
  savePlaybackPosition: vi.fn(),
}));
import {
  beaconPlaybackPosition,
  reportPlaybackStart,
  reportPlaybackProgress,
  reportPlaybackStopped,
  savePlaybackPosition,
} from '../../lib/jellyfinPlayback';
import { usePlaybackReporting } from './usePlaybackReporting';

describe('usePlaybackReporting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    // Unmount BEFORE resetting the mocks: an unmount reports Stopped, and RTL's
    // automatic cleanup would otherwise run after the reset and leak that call
    // into the next test's assertions.
    cleanup();
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('reports start on a new track and stopped on change', () => {
    let pos = 5;
    const { rerender } = renderHook(({ id }) => usePlaybackReporting(id, () => pos), {
      initialProps: { id: 'a' },
    });
    expect(reportPlaybackStart).toHaveBeenCalledWith('a');
    pos = 42;
    rerender({ id: 'b' });
    expect(reportPlaybackStopped).toHaveBeenCalledWith('a', 42);
    expect(reportPlaybackStart).toHaveBeenCalledWith('b');
  });

  it('reports progress on an interval with the live position', () => {
    let pos = 0;
    renderHook(() => usePlaybackReporting('a', () => pos));
    pos = 10;
    vi.advanceTimersByTime(10_000);
    expect(reportPlaybackProgress).toHaveBeenCalledWith('a', 10);
  });

  it('calls onReported once the start report has landed', async () => {
    vi.mocked(reportPlaybackStart).mockResolvedValue(undefined);
    const onReported = vi.fn();
    renderHook(() => usePlaybackReporting('a', () => 0, false, onReported));
    expect(onReported).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(onReported).toHaveBeenCalledTimes(1));
  });

  it('does not call onReported when the start report fails', async () => {
    vi.mocked(reportPlaybackStart).mockRejectedValue(new Error('offline'));
    const onReported = vi.fn();
    renderHook(() => usePlaybackReporting('a', () => 0, false, onReported));
    await Promise.resolve();
    await Promise.resolve();
    expect(onReported).not.toHaveBeenCalled();
  });

  it('a restored, never-played track reports nothing (no Start, Progress or Stopped)', () => {
    const { unmount } = renderHook(() =>
      usePlaybackReporting('book', () => 0, true, undefined, false),
    );
    vi.advanceTimersByTime(30_000);
    unmount();
    expect(reportPlaybackStart).not.toHaveBeenCalled();
    expect(reportPlaybackProgress).not.toHaveBeenCalled();
    expect(reportPlaybackStopped).not.toHaveBeenCalled();
    expect(savePlaybackPosition).not.toHaveBeenCalled();
  });

  it('reports Start only once the track is really playing, then ticks and stops', () => {
    let pos = 0;
    const { rerender, unmount } = renderHook(
      ({ playing }) => usePlaybackReporting('a', () => pos, false, undefined, playing),
      { initialProps: { playing: false } },
    );
    expect(reportPlaybackStart).not.toHaveBeenCalled();
    rerender({ playing: true });
    expect(reportPlaybackStart).toHaveBeenCalledWith('a');
    pos = 7;
    vi.advanceTimersByTime(10_000);
    expect(reportPlaybackProgress).toHaveBeenCalledWith('a', 7);
    unmount();
    expect(reportPlaybackStopped).toHaveBeenCalledWith('a', 7);
  });

  it('beacons an audiobook position on pagehide (closing the app keeps the place)', () => {
    let pos = 0;
    renderHook(() => usePlaybackReporting('book', () => pos, true));
    pos = 42;
    window.dispatchEvent(new Event('pagehide'));
    expect(beaconPlaybackPosition).toHaveBeenCalledWith('book', 42);
  });

  it('ticks are measured from playback START, not from mount', () => {
    let pos = 0;
    const { rerender } = renderHook(
      ({ playing }) => usePlaybackReporting('a', () => pos, false, undefined, playing),
      { initialProps: { playing: false } },
    );
    vi.advanceTimersByTime(9_000); // buffering: nothing has played yet
    rerender({ playing: true });
    pos = 3;
    vi.advanceTimersByTime(5_000); // 5s into playback — no tick yet
    expect(reportPlaybackProgress).not.toHaveBeenCalled();
    pos = 10;
    vi.advanceTimersByTime(5_000); // 10s into playback → first tick
    expect(reportPlaybackProgress).toHaveBeenCalledWith('a', 10);
  });

  it('does nothing without a current track', () => {
    renderHook(() => usePlaybackReporting(undefined, () => 0));
    expect(reportPlaybackStart).not.toHaveBeenCalled();
  });

  it('also saves the resume position for an audiobook (tick + stop)', async () => {
    let pos = 0;
    const { rerender, unmount } = renderHook(
      ({ id }) => usePlaybackReporting(id, () => pos, true),
      {
        initialProps: { id: 'book' },
      },
    );
    pos = 30;
    vi.advanceTimersByTime(10_000);
    expect(reportPlaybackProgress).toHaveBeenCalledWith('book', 30);
    expect(savePlaybackPosition).not.toHaveBeenCalled(); // only after Progress has landed
    await vi.waitFor(() => expect(savePlaybackPosition).toHaveBeenCalledWith('book', 30));
    pos = 90;
    rerender({ id: 'book2' }); // change → stop → THEN save (Stopped zeroes the server position)
    expect(reportPlaybackStopped).toHaveBeenCalledWith('book', 90);
    expect(savePlaybackPosition).not.toHaveBeenCalledWith('book', 90);
    await vi.waitFor(() => expect(savePlaybackPosition).toHaveBeenCalledWith('book', 90));
    unmount(); // don't leak a stop-save into the next test
  });

  it('does NOT save resume position for music (isAudiobook=false)', () => {
    let pos = 0;
    const { unmount } = renderHook(() => usePlaybackReporting('song', () => pos));
    pos = 20;
    vi.advanceTimersByTime(10_000);
    expect(savePlaybackPosition).not.toHaveBeenCalled();
    unmount();
  });
});
