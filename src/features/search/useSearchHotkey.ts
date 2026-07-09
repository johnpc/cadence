import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

/** True when focus is in a text field, where "/" is a literal character and
 * must not be hijacked. */
function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable === true;
}

/**
 * Spotify-style "/" hotkey: jump to Search and focus its box from anywhere.
 * No-ops while typing in a field or with a modifier held. Mounted once at the
 * app shell. Focuses the IonSearchbar's inner input after navigation settles.
 */
export function useSearchHotkey(): void {
  const history = useHistory();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      history.push('/search');
      // Let the route render, then focus the search input.
      setTimeout(() => {
        const box = document.querySelector<HTMLElement>('[data-testid="search-input"]');
        box?.querySelector('input')?.focus();
      }, 60);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [history]);
}
