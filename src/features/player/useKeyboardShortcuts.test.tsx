import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

function actions() {
  return {
    toggle: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    seekBy: vi.fn(),
    nudgeVolume: vi.fn(),
    toggleMute: vi.fn(),
    toggleShuffle: vi.fn(),
    cycleRepeat: vi.fn(),
  };
}
function press(key: string, target?: EventTarget, init?: KeyboardEventInit) {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  if (target) target.dispatchEvent(e);
  else window.dispatchEvent(e);
}

describe('useKeyboardShortcuts', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('maps Space/Arrows to toggle/next/prev', () => {
    const a = actions();
    renderHook(() => useKeyboardShortcuts(a, true));
    press(' ');
    press('ArrowRight');
    press('ArrowLeft');
    expect(a.toggle).toHaveBeenCalledOnce();
    expect(a.next).toHaveBeenCalledOnce();
    expect(a.prev).toHaveBeenCalledOnce();
  });

  it('seeks ∓5s on Shift+←/→ instead of changing track', () => {
    const a = actions();
    renderHook(() => useKeyboardShortcuts(a, true));
    press('ArrowRight', undefined, { shiftKey: true });
    press('ArrowLeft', undefined, { shiftKey: true });
    expect(a.seekBy).toHaveBeenCalledWith(5);
    expect(a.seekBy).toHaveBeenCalledWith(-5);
    expect(a.next).not.toHaveBeenCalled();
    expect(a.prev).not.toHaveBeenCalled();
  });

  it('maps Up/Down to volume nudges and M to mute', () => {
    const a = actions();
    renderHook(() => useKeyboardShortcuts(a, true));
    press('ArrowUp');
    press('ArrowDown');
    press('m');
    expect(a.nudgeVolume).toHaveBeenCalledWith(0.1);
    expect(a.nudgeVolume).toHaveBeenCalledWith(-0.1);
    expect(a.toggleMute).toHaveBeenCalledOnce();
  });

  it('maps S to shuffle and R to repeat (either case)', () => {
    const a = actions();
    renderHook(() => useKeyboardShortcuts(a, true));
    press('s');
    press('R');
    expect(a.toggleShuffle).toHaveBeenCalledOnce();
    expect(a.cycleRepeat).toHaveBeenCalledOnce();
  });

  it('does nothing when disabled', () => {
    const a = actions();
    renderHook(() => useKeyboardShortcuts(a, false));
    press(' ');
    expect(a.toggle).not.toHaveBeenCalled();
  });

  it('ignores keys while typing in an input', () => {
    const a = actions();
    renderHook(() => useKeyboardShortcuts(a, true));
    const input = document.createElement('input');
    document.body.appendChild(input);
    press(' ', input);
    expect(a.toggle).not.toHaveBeenCalled();
  });

  it('ignores shortcut keys combined with a modifier', () => {
    const a = actions();
    renderHook(() => useKeyboardShortcuts(a, true));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', metaKey: true }));
    expect(a.next).not.toHaveBeenCalled();
  });
});
