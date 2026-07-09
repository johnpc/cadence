import { renderHook } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { useSearchHotkey } from './useSearchHotkey';

function setup(initial = '/home') {
  const history = createMemoryHistory({ initialEntries: [initial] });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(Router, { history }, children);
  renderHook(() => useSearchHotkey(), { wrapper });
  return history;
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
    const history = setup('/home');
    press('/');
    expect(history.location.pathname).toBe('/search');
  });

  it('ignores "/" while typing in an input', () => {
    const history = setup('/home');
    const input = document.createElement('input');
    document.body.appendChild(input);
    press('/', {}, input);
    expect(history.location.pathname).toBe('/home');
  });

  it('ignores "/" with a modifier held', () => {
    const history = setup('/home');
    press('/', { metaKey: true });
    expect(history.location.pathname).toBe('/home');
  });

  it('ignores other keys', () => {
    const history = setup('/home');
    press('a');
    expect(history.location.pathname).toBe('/home');
  });
});
