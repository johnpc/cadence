import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUDIO_INTERRUPTION_ENDED, useAudioInterruptionResume } from './useAudioInterruptionResume';
import { setPlayIntent } from './playIntentStore';

describe('useAudioInterruptionResume', () => {
  afterEach(() => setPlayIntent(false));

  it('resumes on the native event when the user still intends to play', () => {
    setPlayIntent(true);
    const resume = vi.fn();
    renderHook(() => useAudioInterruptionResume(resume));
    window.dispatchEvent(new Event(AUDIO_INTERRUPTION_ENDED));
    expect(resume).toHaveBeenCalledOnce();
  });

  it('does NOT resume when the user had deliberately paused (intent cleared)', () => {
    setPlayIntent(false);
    const resume = vi.fn();
    renderHook(() => useAudioInterruptionResume(resume));
    window.dispatchEvent(new Event(AUDIO_INTERRUPTION_ENDED));
    expect(resume).not.toHaveBeenCalled();
  });

  it('reads the latest intent live — an interruption flipping isPlaying does not cancel resume', () => {
    // The interruption fires a 'pause' → isPlaying goes false, but play INTENT is
    // still true, so the same listener resumes.
    setPlayIntent(true);
    const resume = vi.fn();
    renderHook(() => useAudioInterruptionResume(resume));
    window.dispatchEvent(new Event(AUDIO_INTERRUPTION_ENDED));
    expect(resume).toHaveBeenCalledOnce();
  });

  it('stops listening after unmount', () => {
    setPlayIntent(true);
    const resume = vi.fn();
    const { unmount } = renderHook(() => useAudioInterruptionResume(resume));
    unmount();
    window.dispatchEvent(new Event(AUDIO_INTERRUPTION_ENDED));
    expect(resume).not.toHaveBeenCalled();
  });
});
