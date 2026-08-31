import { useEffect, useRef, useState } from 'react';
import { bindAudioElement } from './bindAudioElement';
import { useStallWatchdog } from './useStallWatchdog';
import { adoptPlaybackAudioSession } from '../../lib/webAudioSession';
import { log } from '../../lib/diagnostics/diagnosticsStore';

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
    // Declare this page a playback app to WebKit (iOS 17+) so the WKWebView
    // survives the silent gap between tracks while backgrounded — without it,
    // a slow next-track start (~10s of silence) suspends the whole app and
    // Cadence loses the Now Playing slot (see webAudioSession.ts).
    log('audio-session', 'adopt playback', { ok: String(adoptPlaybackAudioSession()) });
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

  // A stream that stalls forever fires no 'error' — route it into the same
  // reload-then-skip recovery so background playback can't die in silence.
  useStallWatchdog(waiting, position, () => errorRef.current());

  return { ref, isPlaying, waiting, position, duration };
}
