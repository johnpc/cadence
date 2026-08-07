import { useCallback, useEffect, useState, type RefObject } from 'react';

const KEY = 'cadence.playbackRate';

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

function loadRate(): number {
  const raw = Number(localStorage.getItem(KEY));
  return raw ? clampRate(raw) : 1;
}

/**
 * Owns playback speed: applies it to the audio element, persists it per device,
 * and re-applies on track change (a fresh src resets the element's rate). Mirrors
 * useVolume. Useful for the long mixes / spoken-word content a Jellyfin library
 * often holds, not just music.
 */
export function usePlaybackRate(audioRef: RefObject<HTMLAudioElement | null>, currentId?: string) {
  const [rate, setRateState] = useState<number>(loadRate);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate, currentId, audioRef]);

  const setRate = useCallback((next: number) => {
    const value = clampRate(next);
    setRateState(value);
    localStorage.setItem(KEY, String(value));
  }, []);

  return { rate, setRate };
}
