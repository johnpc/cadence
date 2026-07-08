import { useEffect, useRef, useState } from 'react';

/**
 * Owns one long-lived HTMLAudioElement (survives route/modal changes — a JSX
 * <audio> in an unmounting view would not) and surfaces its transport state.
 * `onEnded` fires when a track finishes so the provider can advance the queue.
 */
export function useAudioElement(onEnded: () => void) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  // Keep the latest onEnded without re-binding listeners each render.
  const endedRef = useRef(onEnded);
  endedRef.current = onEnded;

  if (!ref.current && typeof Audio !== 'undefined') {
    ref.current = new Audio();
  }

  useEffect(() => {
    const audio = ref.current;
    if (!audio) return;
    // Attach to the DOM so platform media controls + e2e can see the element.
    if (typeof document !== 'undefined' && !audio.parentNode) {
      audio.setAttribute('hidden', '');
      document.body.appendChild(audio);
    }
    const onTime = () => setPosition(audio.currentTime);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnd = () => endedRef.current();
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnd);
    };
  }, []);

  return { ref, isPlaying, position, duration };
}
