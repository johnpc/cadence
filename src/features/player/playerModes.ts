import type { RepeatMode } from './types';

const KEY = 'cadence.modes';

export interface PlayerModes {
  shuffle: boolean;
  repeat: RepeatMode;
}

const DEFAULT: PlayerModes = { shuffle: false, repeat: 'off' };
const REPEATS: RepeatMode[] = ['off', 'all', 'one'];

/** Load persisted shuffle + repeat so they survive a reload (like Spotify). */
export function loadModes(): PlayerModes {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as Partial<PlayerModes>;
    return {
      shuffle: parsed.shuffle === true,
      repeat: REPEATS.includes(parsed.repeat as RepeatMode) ? (parsed.repeat as RepeatMode) : 'off',
    };
  } catch {
    return DEFAULT;
  }
}

/** Persist shuffle + repeat. */
export function saveModes(modes: PlayerModes): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(modes));
  } catch {
    // best-effort
  }
}
