import { notifyNativePlaybackStarted } from '../../lib/nativeAudioSession';
import { log } from '../../lib/diagnostics/diagnosticsStore';

/** Setters the audio-element effect drives; kept as an interface so the binding
 * (below) is a plain, testable function separate from the hook. */
export interface AudioElementSinks {
  setIsPlaying: (v: boolean) => void;
  setWaiting: (v: boolean) => void;
  setPosition: (v: number) => void;
  setDuration: (v: number) => void;
  onEnded: () => void;
  onError: () => void;
}

/** Attach all transport + diagnostics listeners to the element; returns a cleanup
 * that removes them. Diagnostics logged here: play, pause (with pos + ended so a
 * mid-song pause is distinguishable), a ~10s progress heartbeat (proves audio is
 * ACTUALLY advancing, not just "playing" with no sound), buffering stalls, and
 * errors. Extracted from useAudioElement to keep that hook within the line limit. */
export function bindAudioElement(audio: HTMLAudioElement, s: AudioElementSinks): () => void {
  let lastBeat = -1;
  const onTime = () => {
    s.setPosition(audio.currentTime);
    const bucket = Math.floor(audio.currentTime / 10);
    if (bucket !== lastBeat) {
      lastBeat = bucket;
      log('progress', 'playing', { pos: audio.currentTime.toFixed(1) });
    }
  };
  const onMeta = () => s.setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
  const onPlay = () => {
    s.setIsPlaying(true);
    log('play', 'audio play', { pos: audio.currentTime.toFixed(1) });
    notifyNativePlaybackStarted();
  };
  const onPause = () => {
    s.setIsPlaying(false);
    log('pause', 'audio pause', { pos: audio.currentTime.toFixed(1), ended: String(audio.ended) });
  };
  const onEnd = () => s.onEnded();
  const onErr = () => {
    log('error', 'audio error', {
      code: String(audio.error?.code ?? '?'),
      src: (audio.src ?? '').slice(0, 80),
    });
    s.onError();
  };
  const onWaiting = () => {
    s.setWaiting(true);
    log('waiting', 'buffering stall', { pos: audio.currentTime.toFixed(1) });
  };
  const onResumed = () => s.setWaiting(false);
  const pairs: [string, EventListener][] = [
    ['timeupdate', onTime],
    ['loadedmetadata', onMeta],
    ['play', onPlay],
    ['pause', onPause],
    ['ended', onEnd],
    ['error', onErr],
    ['waiting', onWaiting],
    ['playing', onResumed],
    ['canplay', onResumed],
  ];
  for (const [ev, fn] of pairs) audio.addEventListener(ev, fn);
  return () => {
    for (const [ev, fn] of pairs) audio.removeEventListener(ev, fn);
  };
}
