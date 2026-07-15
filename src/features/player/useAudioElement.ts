import { useEffect, useRef, useState } from 'react';
import { bindAudioElement } from './bindAudioElement';

/**
 * Owns one long-lived HTMLAudioElement (survives route/modal changes — a JSX
 * <audio> in an unmounting view would not) and surfaces its transport state.
 * `onEnded` fires when a track finishes; `onError` fires when a track fails to
 * load (bad transcode, 404) so the provider can skip past it.
 */
export function useAudioElement(onEnded: () => void, onError: () => void = () => {}) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  // Keep the latest callbacks without re-binding listeners each render.
  const endedRef = useRef(onEnded);
  endedRef.current = onEnded;
  const errorRef = useRef(onError);
  errorRef.current = onError;

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
    return bindAudioElement(audio, {
      setIsPlaying,
      setWaiting,
      setPosition,
      setDuration,
      onEnded: () => endedRef.current(),
      onError: () => errorRef.current(),
    });
  }, []);

  return { ref, isPlaying, waiting, position, duration };
}
