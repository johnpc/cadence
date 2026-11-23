import { useCallback, useRef } from 'react';
import { barReveal, barState, endReveal } from './barReveal';

/** The element a page marks as its own title; the bar fades in as it scrolls away. */
export const PAGE_TITLE_ATTR = 'data-page-title';

/** Spread onto a page's own title so the bar knows when it has scrolled away. */
export const pageTitleProps = { [PAGE_TITLE_ATTR]: '' } as const;

/** Drives the floating bar from the content's scroll. It writes the fade straight
 * to the bar as a CSS variable (no React state, so a scroll never re-renders
 * the page) plus a `data-bar` phase for styling and tests. */
export function usePageBar(lead = 0) {
  const ref = useRef<HTMLIonHeaderElement | null>(null);

  const onScroll = useCallback(
    (event: Event) => {
      const bar = ref.current;
      const content = event.target;
      if (!bar || !(content instanceof HTMLElement)) return;
      const title = content.querySelector(`[${PAGE_TITLE_ATTR}]`);
      const reveal = Math.max(
        barReveal(
          bar.getBoundingClientRect().bottom,
          title ? title.getBoundingClientRect().bottom : null,
          lead,
        ),
        endOfScroll(content),
      );
      bar.style.setProperty('--cad-bar-reveal', String(reveal));
      bar.dataset.bar = barState(reveal);
    },
    [lead],
  );

  return { ref, onScroll };
}

/** How close the content is to the end of its scroll range. IonContent scrolls an
 * inner element in its (open) shadow root; elsewhere the element scrolls itself. */
function endOfScroll(content: HTMLElement): number {
  const scroller = content.shadowRoot?.querySelector<HTMLElement>('.inner-scroll') ?? content;
  const remaining = scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
  return endReveal(scroller.scrollTop, remaining);
}
