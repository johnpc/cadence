import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AUDIO_INTERRUPTION_ENDED, useAudioInterruptionResume } from './useAudioInterruptionResume';

describe('useAudioInterruptionResume', () => {
  it('resumes on the native event when the player still intends to play', () => {
    const resume = vi.fn();
    renderHook(() => useAudioInterruptionResume(true, resume));
    window.dispatchEvent(new Event(AUDIO_INTERRUPTION_ENDED));
    expect(resume).toHaveBeenCalledOnce();
  });

  it('does NOT resume when the user had deliberately paused', () => {
    const resume = vi.fn();
    renderHook(() => useAudioInterruptionResume(false, resume));
    window.dispatchEvent(new Event(AUDIO_INTERRUPTION_ENDED));
    expect(resume).not.toHaveBeenCalled();
  });

  it('reads the latest intent without re-subscribing (ref, not stale closure)', () => {
    const resume = vi.fn();
    const { rerender } = renderHook(({ playing }) => useAudioInterruptionResume(playing, resume), {
      initialProps: { playing: false },
    });
    // Intent flips to playing after mount; the same listener must see it.
    rerender({ playing: true });
    window.dispatchEvent(new Event(AUDIO_INTERRUPTION_ENDED));
    expect(resume).toHaveBeenCalledOnce();
  });

  it('stops listening after unmount', () => {
    const resume = vi.fn();
    const { unmount } = renderHook(() => useAudioInterruptionResume(true, resume));
    unmount();
    window.dispatchEvent(new Event(AUDIO_INTERRUPTION_ENDED));
    expect(resume).not.toHaveBeenCalled();
  });
});
