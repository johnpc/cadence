import { useEffect, useState } from 'react';

/** True when focus is in a text field, where "?" is a literal character. */
function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable === true;
}

/**
 * Spotify-style "?" hotkey that toggles the keyboard-shortcuts help overlay.
 * No-ops while typing in a field or with a modifier held. Mounted once at the
 * app shell; returns the open state + a setter for the modal.
 */
export function useHelpHotkey() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '?' || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      setOpen((o) => !o);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return { helpOpen: open, setHelpOpen: setOpen };
}
