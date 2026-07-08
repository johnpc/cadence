import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinPlayback', () => ({
  reportPlaybackStart: vi.fn(),
  reportPlaybackProgress: vi.fn(),
  reportPlaybackStopped: vi.fn(),
}));
import {
  reportPlaybackStart,
  reportPlaybackProgress,
  reportPlaybackStopped,
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

  it('does nothing without a current track', () => {
    renderHook(() => usePlaybackReporting(undefined, () => 0));
    expect(reportPlaybackStart).not.toHaveBeenCalled();
  });
});
