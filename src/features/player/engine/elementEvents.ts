import type { AudioLike, LogFn } from './types';
import type { ElementEvent } from './transitions';

/** What the engine does with each element event. */
export interface ElementHandlers {
  transport(event: ElementEvent): void;
  /** Audio really started (the element's `play`). */
  audible(): void;
  position(seconds: number): void;
  /** The element jumped (a resume, a chapter tap, a scrub). Not playback
   * progress — the stall watchdog must not treat it as audio advancing. */
  seek(seconds: number): void;
  duration(seconds: number): void;
  ended(): void;
  error(): void;
}

/**
 * Attach the element's events to the engine — plus the diagnostics each one
 * logs: play, pause (with position + whether it ended), buffering stalls, a ~10 s
 * progress heartbeat (proves audio is ACTUALLY advancing), and errors with code
 * and src. Returns the matching detach.
 */
export function bindElementEvents(audio: AudioLike, h: ElementHandlers, log: LogFn): () => void {
  const pos = () => audio.currentTime.toFixed(1);
  let lastBeat = -1;
  const pairs: Array<[string, () => void]> = [
    [
      'play',
      () => {
        log('play', 'audio play', { pos: pos() });
        h.audible();
      },
    ],
    [
      'pause',
      () => {
        log('pause', 'audio pause', { pos: pos(), ended: String(audio.ended) });
        h.transport('pause');
      },
    ],
    [
      'waiting',
      () => {
        log('waiting', 'buffering stall', { pos: pos() });
        h.transport('waiting');
      },
    ],
    ['playing', () => h.transport('resumed')],
    ['canplay', () => h.transport('resumed')],
    [
      'timeupdate',
      () => {
        h.position(audio.currentTime);
        const beat = Math.floor(audio.currentTime / 10);
        if (beat === lastBeat) return;
        lastBeat = beat;
        log('progress', 'playing', { pos: pos() });
      },
    ],
    // A seek moves the playhead before any audio plays (a resume lands while the
    // stream is still buffering), so the bars must follow it right away instead
    // of sitting at 0:00 until the first timeupdate.
    ['seeking', () => h.seek(audio.currentTime)],
    ['loadedmetadata', () => h.duration(Number.isFinite(audio.duration) ? audio.duration : 0)],
    ['ended', () => h.ended()],
    [
      'error',
      () => {
        log('error', 'audio error', {
          code: String(audio.error?.code ?? '?'),
          src: (audio.src ?? '').slice(0, 80),
        });
        h.error();
      },
    ],
  ];
  for (const [event, fn] of pairs) audio.addEventListener(event, fn);
  return () => {
    for (const [event, fn] of pairs) audio.removeEventListener(event, fn);
  };
}
