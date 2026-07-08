import { useEffect } from 'react';

export interface ShortcutActions {
  toggle: () => void;
  next: () => void;
  prev: () => void;
}

/** True when focus is in a text field, where our shortcuts must not steal keys. */
function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable === true;
}

/**
 * Desktop keyboard transport: Space = play/pause, ArrowRight = next,
 * ArrowLeft = prev. No-ops while typing in a field. `enabled` gates it so the
 * shortcuts only act when a track is loaded.
 */
export function useKeyboardShortcuts(actions: ShortcutActions, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === ' ') {
        e.preventDefault();
        actions.toggle();
      } else if (e.key === 'ArrowRight') {
        actions.next();
      } else if (e.key === 'ArrowLeft') {
        actions.prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions, enabled]);
}
