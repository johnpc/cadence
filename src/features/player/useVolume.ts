import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

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

  // Volume before the last mute, so a mute→unmute restores the prior level.
  const premute = useRef(1);
  const nudgeVolume = useCallback(
    (delta: number) => setVolume(volume + delta),
    [setVolume, volume],
  );
  const toggleMute = useCallback(() => {
    if (volume === 0) {
      setVolume(premute.current || 1);
    } else {
      premute.current = volume;
      setVolume(0);
    }
  }, [setVolume, volume]);

  return { volume, setVolume, nudgeVolume, toggleMute };
}
