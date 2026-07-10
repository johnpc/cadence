import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useScrollToTopOnRetap } from './useScrollToTopOnRetap';

const wrapAt = (path: string) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>;
  };

/** Mount a visible ion-content with a spyable scrollToTop, plus a hidden one
 * that must never be scrolled. Returns the visible element's spy. */
function mountContents() {
  document.body.innerHTML = `
    <div class="ion-page"><ion-content id="visible"></ion-content></div>
    <div class="ion-page ion-page-hidden"><ion-content id="hidden"></ion-content></div>`;
  const visible = document.querySelector('#visible') as HTMLElement & { scrollToTop: () => void };
  const hidden = document.querySelector('#hidden') as HTMLElement & { scrollToTop: () => void };
  visible.scrollToTop = vi.fn();
  hidden.scrollToTop = vi.fn();
  return { visible, hidden };
}

describe('useScrollToTopOnRetap', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('scrolls the visible content to top when re-tapping the current tab', () => {
    const { visible, hidden } = mountContents();
    const { result } = renderHook(() => useScrollToTopOnRetap(), { wrapper: wrapAt('/home') });
    result.current('/home')();
    expect(visible.scrollToTop).toHaveBeenCalledWith(300);
    expect(hidden.scrollToTop).not.toHaveBeenCalled();
  });

  it('does nothing when tapping a different tab (lets the router navigate)', () => {
    const { visible } = mountContents();
    const { result } = renderHook(() => useScrollToTopOnRetap(), { wrapper: wrapAt('/home') });
    result.current('/search')();
    expect(visible.scrollToTop).not.toHaveBeenCalled();
  });

  it('is a safe no-op when no content is mounted', () => {
    const { result } = renderHook(() => useScrollToTopOnRetap(), { wrapper: wrapAt('/home') });
    expect(() => result.current('/home')()).not.toThrow();
  });
});
