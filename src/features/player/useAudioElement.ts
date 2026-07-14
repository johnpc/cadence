import { useEffect, useRef, useState } from 'react';
import { notifyNativePlaybackStarted } from '../../lib/nativeAudioSession';

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
    const onTime = () => setPosition(audio.currentTime);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => {
      setIsPlaying(true);
      // Re-assert the native iOS audio session on each real play so background /
      // lock-screen playback survives (no-op on web/Android).
      notifyNativePlaybackStarted();
    };
    const onPause = () => setIsPlaying(false);
    const onEnd = () => endedRef.current();
    const onErr = () => errorRef.current();
    // Buffering/stall: 'waiting' fires when playback halts for data; 'playing'
    // and 'canplay' fire when it has enough to resume. Drives the spinner.
    const onWaiting = () => setWaiting(true);
    const onResumed = () => setWaiting(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('error', onErr);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onResumed);
    audio.addEventListener('canplay', onResumed);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('error', onErr);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onResumed);
      audio.removeEventListener('canplay', onResumed);
    };
  }, []);

  return { ref, isPlaying, waiting, position, duration };
}
