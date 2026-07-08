import { useCallback, useEffect, useState, type RefObject } from 'react';

const KEY = 'cadence.volume';

function loadVolume(): number {
  const stored = localStorage.getItem(KEY);
  if (stored === null) return 1;
  const raw = Number(stored);
  return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : 1;
}

/**
 * Owns playback volume (0–1): applies it to the audio element, persists it per
 * device, and re-applies on track change (a fresh src resets element volume).
 */
export function useVolume(audioRef: RefObject<HTMLAudioElement | null>, currentId?: string) {
  const [volume, setVolumeState] = useState<number>(loadVolume);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume, currentId, audioRef]);

  const setVolume = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(1, next));
    setVolumeState(clamped);
    localStorage.setItem(KEY, String(clamped));
  }, []);

  return { volume, setVolume };
}
