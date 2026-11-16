import { afterEach, describe, expect, it, vi } from 'vitest';
import { attachDocumentTitle } from './documentTitle';
import { attachInterruptionResume, AUDIO_INTERRUPTION_ENDED } from './interruptionResume';
import { actionFor, attachKeyboardShortcuts } from './keyboardShortcuts';
import { startedEngine, track } from '../../../test/engineHarness';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('attachDocumentTitle', () => {
  it('shows "Song · Artist", just the name without an artist, and resets', () => {
    const { engine } = startedEngine();
    const off = attachDocumentTitle(engine);
    expect(document.title).toBe('Cadence');
    engine.playQueue([track('a', { Artists: ['Ada'] }), track('b')], 0);
    expect(document.title).toBe('Song a · Ada');
    engine.next();
    expect(document.title).toBe('Song b');
    engine.stop();
    expect(document.title).toBe('Cadence');
    engine.playQueue([track('c')], 0);
    off();
    expect(document.title).toBe('Cadence');
  });
});

describe('attachInterruptionResume', () => {
  it('resumes on the native nudge only while the user still intends to play', () => {
    const { engine } = startedEngine();
    const resume = vi.spyOn(engine, 'resume');
    const off = attachInterruptionResume(engine);
    engine.playQueue([track('a')], 0);
    window.dispatchEvent(new Event(AUDIO_INTERRUPTION_ENDED));
    expect(resume).toHaveBeenCalledTimes(1);
    engine.pause();
    window.dispatchEvent(new Event(AUDIO_INTERRUPTION_ENDED));
    expect(resume).toHaveBeenCalledTimes(1);
    off();
  });
});

describe('keyboard shortcuts', () => {
  const actions = () => ({
    toggle: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    seekBy: vi.fn(),
    nudgeVolume: vi.fn(),
    toggleMute: vi.fn(),
    toggleShuffle: vi.fn(),
    cycleRepeat: vi.fn(),
  });

  it('maps keys (case-insensitive letters, Shift for seek)', () => {
    const a = actions();
    for (const key of [' ', 'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'M', 's', 'R']) {
      actionFor({ key, shiftKey: false }, a)?.();
    }
    actionFor({ key: 'ArrowRight', shiftKey: true }, a)?.();
    actionFor({ key: 'ArrowLeft', shiftKey: true }, a)?.();
    expect(a.toggle).toHaveBeenCalled();
    expect(a.next).toHaveBeenCalled();
    expect(a.prev).toHaveBeenCalled();
    expect(a.nudgeVolume.mock.calls).toEqual([[0.1], [-0.1]]);
    expect(a.toggleMute).toHaveBeenCalled();
    expect(a.toggleShuffle).toHaveBeenCalled();
    expect(a.cycleRepeat).toHaveBeenCalled();
    expect(a.seekBy.mock.calls).toEqual([[5], [-5]]);
    expect(actionFor({ key: 'x', shiftKey: false }, a)).toBeNull();
  });

  it('acts only with a track loaded, never while typing or with a modifier', () => {
    const { engine } = startedEngine();
    const toggle = vi.spyOn(engine, 'toggle');
    const off = attachKeyboardShortcuts(engine);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    engine.playQueue([track('a')], 0);
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', metaKey: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q' }));
    expect(toggle).not.toHaveBeenCalled();
    const e = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    window.dispatchEvent(e);
    expect(toggle).toHaveBeenCalledTimes(1);
    expect(e.defaultPrevented).toBe(true);
    off();
    input.remove();
  });
});
