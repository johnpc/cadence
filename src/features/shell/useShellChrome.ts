import { useEffect } from 'react';
import { useSearchHotkey } from '../search/useSearchHotkey';

/** App-shell chrome side-effects: flag the body so CSS can inset pages for the
 * desktop sidebar (no-op on mobile, where the sidebar is hidden), and bind the
 * "/" search hotkey. Grouped so AppTabs stays a render-only shell. */
export function useShellChrome(): void {
  useEffect(() => {
    document.body.classList.add('app-has-sidebar');
    return () => document.body.classList.remove('app-has-sidebar');
  }, []);
  useSearchHotkey();
}
