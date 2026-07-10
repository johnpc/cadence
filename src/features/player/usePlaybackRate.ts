import { useCallback, useEffect, useState, type RefObject } from 'react';

const KEY = 'cadence.playbackRate';

/** The offered speeds (Spotify-style). 1 is normal. */
export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;

function loadRate(): number {
  const raw = Number(localStorage.getItem(KEY));
  return (PLAYBACK_RATES as readonly number[]).includes(raw) ? raw : 1;
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
    const value = (PLAYBACK_RATES as readonly number[]).includes(next) ? next : 1;
    setRateState(value);
    localStorage.setItem(KEY, String(value));
  }, []);

  return { rate, setRate };
}
