import { useEffect } from 'react';

export interface ShortcutActions {
  toggle: () => void;
  next: () => void;
  prev: () => void;
  /** Nudge the volume by a delta in [-1,1] (clamped by the handler). */
  nudgeVolume: (delta: number) => void;
  toggleMute: () => void;
}

/** True when focus is in a text field, where our shortcuts must not steal keys. */
function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable === true;
}

/** Map a keydown to a player action, or null if it isn't a shortcut. */
function actionFor(e: KeyboardEvent, a: ShortcutActions): (() => void) | null {
  switch (e.key) {
    case ' ':
      return a.toggle;
    case 'ArrowRight':
      return a.next;
    case 'ArrowLeft':
      return a.prev;
    case 'ArrowUp':
      return () => a.nudgeVolume(0.1);
    case 'ArrowDown':
      return () => a.nudgeVolume(-0.1);
    case 'm':
    case 'M':
      return a.toggleMute;
    default:
      return null;
  }
}

/**
 * Desktop keyboard transport: Space = play/pause, ←/→ = prev/next,
 * ↑/↓ = volume, M = mute. No-ops while typing in a field. `enabled` gates it so
 * the shortcuts only act when a track is loaded.
 */
export function useKeyboardShortcuts(actions: ShortcutActions, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const run = actionFor(e, actions);
      if (!run) return;
      e.preventDefault();
      run();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions, enabled]);
}
