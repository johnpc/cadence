import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useHelpHotkey } from './useHelpHotkey';

function pressHelp(target?: EventTarget, opts: KeyboardEventInit = {}) {
  const e = new KeyboardEvent('keydown', { key: '?', bubbles: true, cancelable: true, ...opts });
  (target ?? window).dispatchEvent(e);
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('useHelpHotkey', () => {
  it('starts closed and toggles open/closed on "?"', () => {
    const { result } = renderHook(() => useHelpHotkey());
    expect(result.current.helpOpen).toBe(false);
    act(() => pressHelp());
    expect(result.current.helpOpen).toBe(true);
    act(() => pressHelp());
    expect(result.current.helpOpen).toBe(false);
  });

  it('ignores "?" while typing in a field', () => {
    const { result } = renderHook(() => useHelpHotkey());
    const input = document.createElement('input');
    document.body.appendChild(input);
    act(() => pressHelp(input));
    expect(result.current.helpOpen).toBe(false);
  });

  it('ignores "?" with a modifier held', () => {
    const { result } = renderHook(() => useHelpHotkey());
    act(() => pressHelp(undefined, { metaKey: true }));
    expect(result.current.helpOpen).toBe(false);
  });

  it('lets the setter close the overlay', () => {
    const { result } = renderHook(() => useHelpHotkey());
    act(() => pressHelp());
    expect(result.current.helpOpen).toBe(true);
    act(() => result.current.setHelpOpen(false));
    expect(result.current.helpOpen).toBe(false);
  });
});
