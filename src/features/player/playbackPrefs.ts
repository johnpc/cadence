/**
 * Per-device playback preferences — volume and speed — and the speed presets
 * the Settings + audiobook controls offer. Persisted in localStorage; read once
 * when the player engine is created, written on every change.
 */
const VOLUME_KEY = 'cadence.volume';
const RATE_KEY = 'cadence.playbackRate';

/** Discrete presets for the Settings speed control. 1 is normal. */
export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2, 2.5, 3] as const;

/** Continuous speed bounds + step for the audiobook player's slider: 0.5×–3× in
 * 0.25 increments (1 = normal). */
export const RATE_MIN = 0.5;
export const RATE_MAX = 3;
export const RATE_STEP = 0.25;

/** Snap a value to the nearest 0.25 step within [0.5, 3]; invalid → 1. Rounds off
 * fp drift so persisted/compared rates stay clean (e.g. 1.75, not 1.750000002). */
export function clampRate(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const snapped = Math.round(value / RATE_STEP) * RATE_STEP;
  const bounded = Math.min(RATE_MAX, Math.max(RATE_MIN, snapped));
  return Math.round(bounded * 100) / 100;
}

/** Clamp a volume to [0, 1]; anything non-finite reads as full volume. */
export function clampVolume(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 1;
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Storage full / unavailable — preferences are best-effort.
  }
}

/** The saved volume (0–1), or full volume when unset or junk. */
export function loadVolume(): number {
  const stored = read(VOLUME_KEY);
  if (stored === null) return 1;
  const raw = Number(stored);
  return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : 1;
}

export const saveVolume = (volume: number): void => write(VOLUME_KEY, volume);

/** The saved speed, snapped to a valid step; 1× when unset or junk. */
export function loadRate(): number {
  const raw = Number(read(RATE_KEY));
  return raw ? clampRate(raw) : 1;
}

export const saveRate = (rate: number): void => write(RATE_KEY, rate);
