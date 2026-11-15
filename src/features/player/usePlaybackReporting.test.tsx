import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinPlayback', () => ({
  reportPlaybackStart: vi.fn(),
  reportPlaybackProgress: vi.fn(),
  reportPlaybackStopped: vi.fn(),
  savePlaybackPosition: vi.fn(),
}));
import {
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

  it('does nothing without a current track', () => {
    renderHook(() => usePlaybackReporting(undefined, () => 0));
    expect(reportPlaybackStart).not.toHaveBeenCalled();
  });

  it('also saves the resume position for an audiobook (tick + stop)', () => {
    let pos = 0;
    const { rerender, unmount } = renderHook(
      ({ id }) => usePlaybackReporting(id, () => pos, true),
      {
        initialProps: { id: 'book' },
      },
    );
    pos = 30;
    vi.advanceTimersByTime(10_000);
    expect(savePlaybackPosition).toHaveBeenCalledWith('book', 30);
    pos = 90;
    rerender({ id: 'book2' }); // change → stop → save
    expect(savePlaybackPosition).toHaveBeenCalledWith('book', 90);
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
