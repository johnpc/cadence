import { act, renderHook } from '@testing-library/react';
import { createMemoryHistory } from 'history';
import { Router } from 'react-router-dom';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { useShellChrome } from './useShellChrome';

function setup() {
  const history = createMemoryHistory({ initialEntries: ['/home'] });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(Router, { history }, children);
  const view = renderHook(() => useShellChrome(), { wrapper });
  return { history, ...view };
}

afterEach(() => {
  document.body.className = '';
});

describe('useShellChrome', () => {
  it('adds the sidebar body class while mounted and removes it on unmount', () => {
    const { unmount } = setup();
    expect(document.body.classList.contains('app-has-sidebar')).toBe(true);
    unmount();
    expect(document.body.classList.contains('app-has-sidebar')).toBe(false);
  });

  it('binds the "/" search hotkey (navigates to Search)', () => {
    const { history } = setup();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true }));
    expect(history.location.pathname).toBe('/search');
  });

  it('exposes help-overlay state that "?" toggles', () => {
    const { result } = setup();
    expect(result.current.helpOpen).toBe(false);
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true })));
    expect(result.current.helpOpen).toBe(true);
  });
});
