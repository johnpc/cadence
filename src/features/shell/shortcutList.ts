/** The keyboard shortcuts Cadence binds, as displayable rows — the single
 * source of truth for the "?" help overlay. Keys mirror useKeyboardShortcuts
 * (player transport) + useSearchHotkey ("/") + useHelpHotkey ("?"). */
export interface Shortcut {
  /** Key label(s) shown as <kbd> chips, e.g. ['Space'] or ['↑', '↓']. */
  keys: string[];
  /** What the shortcut does. */
  label: string;
}

export const SHORTCUTS: Shortcut[] = [
  { keys: ['Space'], label: 'Play / pause' },
  { keys: ['←', '→'], label: 'Previous / next track' },
  { keys: ['↑', '↓'], label: 'Volume up / down' },
  { keys: ['M'], label: 'Mute' },
  { keys: ['S'], label: 'Shuffle' },
  { keys: ['R'], label: 'Repeat' },
  { keys: ['/'], label: 'Search' },
  { keys: ['?'], label: 'This shortcuts help' },
];
