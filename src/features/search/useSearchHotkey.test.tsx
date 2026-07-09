import { renderHook } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSearchHotkey } from './useSearchHotkey';

function setup(initial = '/home') {
  const history = createMemoryHistory({ initialEntries: [initial] });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(Router, { history }, children);
  const view = renderHook(() => useSearchHotkey(), { wrapper });
  return { history, unmount: view.unmount };
}

function press(key: string, opts: KeyboardEventInit = {}, target?: EventTarget) {
  const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts });
  (target ?? window).dispatchEvent(e);
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('useSearchHotkey', () => {
  it('navigates to /search when "/" is pressed', () => {
    const { history } = setup('/home');
    press('/');
    expect(history.location.pathname).toBe('/search');
  });

  it('ignores "/" while typing in an input', () => {
    const { history } = setup('/home');
    const input = document.createElement('input');
    document.body.appendChild(input);
    press('/', {}, input);
    expect(history.location.pathname).toBe('/home');
  });

  it('ignores "/" with a modifier held', () => {
    const { history } = setup('/home');
    press('/', { metaKey: true });
    expect(history.location.pathname).toBe('/home');
  });

  it('ignores other keys', () => {
    const { history } = setup('/home');
    press('a');
    expect(history.location.pathname).toBe('/home');
  });

  it('clears the pending focus timer on unmount (no post-teardown fire)', () => {
    vi.useFakeTimers();
    try {
      const { unmount } = setup('/home');
      press('/'); // schedules the 60ms focus timer
      unmount(); // cleanup must clear it
      const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
      vi.runAllTimers(); // if the timer survived, it would run now
      expect(focusSpy).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
