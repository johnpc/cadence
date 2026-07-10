import { useEffect } from 'react';
import { useSearchHotkey } from '../search/useSearchHotkey';
import { useHelpHotkey } from './useHelpHotkey';

/** App-shell chrome side-effects: flag the body so CSS can inset pages for the
 * desktop sidebar (no-op on mobile, where the sidebar is hidden), bind the "/"
 * search hotkey, and manage the "?" keyboard-shortcuts help overlay. Returns the
 * help modal's open state so AppTabs can render it while staying render-only. */
export function useShellChrome() {
  useEffect(() => {
    document.body.classList.add('app-has-sidebar');
    return () => document.body.classList.remove('app-has-sidebar');
  }, []);
  useSearchHotkey();
  return useHelpHotkey();
}
