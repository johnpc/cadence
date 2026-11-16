import { useCallback, useState } from 'react';

/**
 * Which ONE of a screen's overlays (action sheet, picker, alert, modal) is open,
 * as a single value instead of a boolean per overlay — so two can never be open
 * at once and "nothing open" is one state.
 *
 * `closed(name)` only resets when `name` is still the open overlay. That matters
 * with Ionic: tapping "Add to playlist" in a sheet opens the picker, THEN the
 * first sheet fires `onDidDismiss` — an unconditional reset would close the
 * picker the user just opened.
 */
export function useOverlay<T extends string>() {
  const [open, setOpen] = useState<T | null>(null);
  const show = useCallback((name: T) => setOpen(name), []);
  const closed = useCallback((name: T) => setOpen((cur) => (cur === name ? null : cur)), []);
  return { open, show, closed };
}
