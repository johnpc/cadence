import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/** The currently-visible page's scrollable content (Ionic hides inactive
 * pages with .ion-page-hidden), or null if none is mounted yet. */
function activeContent(): HTMLElement | null {
  return document.querySelector('.ion-page:not(.ion-page-hidden) ion-content');
}

/**
 * iOS/Spotify convention: tapping the tab you're ALREADY on scrolls that view
 * back to the top. Returns an onClick factory — pass the tab's path; if it's the
 * current route, the visible ion-content smooth-scrolls to top (and we let the
 * event proceed so a tap on a different tab still navigates normally).
 */
export function useScrollToTopOnRetap() {
  const { pathname } = useLocation();
  return useCallback(
    (path: string) => () => {
      if (pathname !== path) return; // navigating away — let the router handle it
      const content = activeContent() as
        (HTMLElement & { scrollToTop?: (ms: number) => void }) | null;
      void content?.scrollToTop?.(300);
    },
    [pathname],
  );
}
