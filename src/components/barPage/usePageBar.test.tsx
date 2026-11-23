import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PAGE_TITLE_ATTR, usePageBar } from './usePageBar';

/** An element whose box bottom sits at `bottom` px. */
function boxAt(tag: string, bottom: number) {
  const el = document.createElement(tag);
  el.getBoundingClientRect = () => ({ bottom }) as DOMRect;
  return el;
}

function scrolled(bar: HTMLElement, content: EventTarget, lead = 0) {
  const { result } = renderHook(() => usePageBar(lead));
  result.current.ref.current = bar as HTMLIonHeaderElement;
  act(() => result.current.onScroll({ target: content } as unknown as Event));
}

describe('usePageBar', () => {
  it('stays clear while the page title is below the bar', () => {
    const bar = boxAt('ion-header', 100);
    const content = document.createElement('div');
    const title = boxAt('h1', 140);
    title.setAttribute(PAGE_TITLE_ATTR, '');
    content.append(title);
    scrolled(bar, content);
    expect(bar.style.getPropertyValue('--cad-bar-reveal')).toBe('0');
    expect(bar.dataset.bar).toBe('clear');
  });

  it('turns solid once the title has slid under the bar', () => {
    const bar = boxAt('ion-header', 100);
    const content = document.createElement('div');
    const title = boxAt('h1', 20);
    title.setAttribute(PAGE_TITLE_ATTR, '');
    content.append(title);
    scrolled(bar, content);
    expect(bar.style.getPropertyValue('--cad-bar-reveal')).toBe('1');
    expect(bar.dataset.bar).toBe('solid');
  });

  it('fills early by the lead on a detail page', () => {
    const bar = boxAt('ion-header', 100);
    const content = document.createElement('div');
    const title = boxAt('h1', 100);
    title.setAttribute(PAGE_TITLE_ATTR, '');
    content.append(title);
    scrolled(bar, content, 32);
    expect(bar.dataset.bar).toBe('solid');
  });

  it('turns solid at the end of a page too short to tuck its title away', () => {
    const bar = boxAt('ion-header', 100);
    const content = document.createElement('div');
    const title = boxAt('h1', 200);
    title.setAttribute(PAGE_TITLE_ATTR, '');
    content.append(title);
    const scroller = document.createElement('div');
    scroller.className = 'inner-scroll';
    content.attachShadow({ mode: 'open' }).append(scroller);
    Object.defineProperties(scroller, {
      scrollHeight: { value: 900 },
      clientHeight: { value: 800 },
      scrollTop: { value: 100 },
    });
    const { result } = renderHook(() => usePageBar());
    result.current.ref.current = bar as HTMLIonHeaderElement;
    act(() =>
      result.current.onScroll({
        target: content,
        detail: { event: { target: scroller } },
      } as unknown as Event),
    );
    expect(bar.dataset.bar).toBe('solid');
  });

  it('is solid on a page with no marked title, and ignores a scroll before mount', () => {
    const bar = boxAt('ion-header', 100);
    scrolled(bar, document.createElement('div'));
    expect(bar.dataset.bar).toBe('solid');

    const { result } = renderHook(() => usePageBar());
    expect(() => result.current.onScroll({ target: null } as unknown as Event)).not.toThrow();
  });
});
