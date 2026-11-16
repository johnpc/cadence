import { currentTrack } from '../queue';
import type { PlayerCommands, PlayerEngine } from '../engine/types';

/** How far Shift+←/→ jumps within the current track. */
const SEEK_STEP = 5;

/** True when focus is in a text field, where shortcuts must not steal keys. */
function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable === true;
}

type Keyed = Pick<
  PlayerCommands,
  | 'toggle'
  | 'next'
  | 'prev'
  | 'seekBy'
  | 'nudgeVolume'
  | 'toggleMute'
  | 'toggleShuffle'
  | 'cycleRepeat'
>;

/** Map a keydown to a player action, or null if it isn't a shortcut. The help
 * overlay (shell/shortcutList) documents the same keys. */
export function actionFor(
  e: Pick<KeyboardEvent, 'key' | 'shiftKey'>,
  a: Keyed,
): (() => void) | null {
  const shift = e.shiftKey;
  const table: Record<string, () => void> = {
    ' ': a.toggle,
    // Shift+←/→ seeks within the track; plain ←/→ change track (Spotify-style).
    ArrowRight: shift ? () => a.seekBy(SEEK_STEP) : a.next,
    ArrowLeft: shift ? () => a.seekBy(-SEEK_STEP) : a.prev,
    ArrowUp: () => a.nudgeVolume(0.1),
    ArrowDown: () => a.nudgeVolume(-0.1),
    m: a.toggleMute,
    s: a.toggleShuffle,
    r: a.cycleRepeat,
  };
  return table[e.key.length === 1 ? e.key.toLowerCase() : e.key] ?? null;
}

/** Desktop keyboard transport, active only while a track is loaded and never
 * while typing or with a modifier held. */
export function attachKeyboardShortcuts(engine: PlayerEngine): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (!currentTrack(engine.state.get().queue)) return;
    if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
    const run = actionFor(e, engine);
    if (!run) return;
    e.preventDefault();
    run();
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
