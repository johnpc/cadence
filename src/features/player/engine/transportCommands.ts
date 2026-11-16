import * as q from '../queue';
import { prevAction } from '../prevAction';
import { clampRate, clampVolume } from '../playbackPrefs';
import { isCasting, isPlayingState } from './transitions';
import type { SleepMode } from '../types';
import type { EngineCore } from './core';
import type { PlayerCommands } from './types';

type TransportCommands = Omit<
  PlayerCommands,
  | 'playQueue'
  | 'playShuffled'
  | 'playNext'
  | 'addToQueue'
  | 'next'
  | 'jumpTo'
  | 'removeFromQueue'
  | 'moveInQueue'
  | 'clearQueue'
  | 'toggleShuffle'
  | 'cycleRepeat'
>;

/** Transport, sleep and level commands. While casting, play/pause/seek drive
 * the receiver instead of the silent local element; play/pause are DIRECTIONAL
 * there too, so a lock-screen "play" can never pause the TV. */
export function transportCommands(core: EngineCore): TransportCommands & { dispose(): void } {
  const { deps, get, patch, setQueue } = core;
  const { audio, cast, log } = deps;
  const ignore = () => undefined;
  let sleepTimer: ReturnType<typeof setTimeout> | null = null;
  let premute = 1;

  const c: TransportCommands = {
    stop: () => {
      if (cast.connected()) void cast.stop().catch(ignore);
      patch({ intent: false });
      setQueue(q.EMPTY_QUEUE);
    },
    toggle: () => {
      if (!get().queue.tracks.length) return;
      deps.haptic();
      const playing = isPlayingState(get());
      log('toggle', 'user toggle', { wasPlaying: String(playing), paused: String(audio.paused) });
      if (playing) c.pause();
      else c.play();
    },
    play: () => {
      const s = get();
      if (!s.queue.tracks.length) return;
      patch({ intent: true });
      if (isCasting(s.status)) {
        if (s.status === 'casting-paused') void cast.toggle().catch(ignore);
        return;
      }
      void audio.play().catch((e: unknown) => {
        log('play-rejected', 'explicit play() rejected', {
          reason: e instanceof Error ? e.name : 'unknown',
        });
      });
    },
    pause: () => {
      const s = get();
      patch({ intent: false });
      if (!isCasting(s.status)) audio.pause();
      else if (s.status === 'casting') void cast.toggle().catch(ignore);
    },
    // After an OS interruption iOS can leave the element "not paused" yet silent,
    // so play() unconditionally — never guard on `audio.paused`.
    resume: () => {
      const s = get();
      if (s.queue.tracks.length && !isCasting(s.status)) void audio.play().catch(ignore);
    },
    // Smart previous: restart when a few seconds in, else the prior track. While
    // casting the local element sits at 0, so it always goes back (like the TV).
    prev: () => {
      const s = get();
      if (!isCasting(s.status) && prevAction(audio.currentTime) === 'restart') c.seek(0);
      else setQueue(q.prev(s.queue, s.repeat === 'all'));
    },
    seek: (seconds) => {
      if (isCasting(get().status)) void cast.seek(seconds).catch(ignore);
      else audio.currentTime = seconds;
    },
    seekBy: (delta) => {
      const max = Number.isFinite(audio.duration) ? audio.duration : audio.currentTime + delta;
      audio.currentTime = Math.max(0, Math.min(audio.currentTime + delta, max));
    },
    armSleep: (mode: SleepMode) => {
      if (sleepTimer) clearTimeout(sleepTimer);
      sleepTimer = null;
      const next: SleepMode = mode === 'track' ? 'track' : mode && mode > 0 ? mode : null;
      patch({ sleep: next });
      if (typeof next !== 'number') return;
      sleepTimer = setTimeout(() => {
        sleepTimer = null;
        c.pause();
        patch({ sleep: null });
      }, next * 60_000);
    },
    setVolume: (volume) => {
      const v = clampVolume(volume);
      patch({ volume: v });
      audio.volume = v;
      deps.persist.volume(v);
    },
    nudgeVolume: (delta) => c.setVolume(get().volume + delta),
    toggleMute: () => {
      const v = get().volume;
      if (v !== 0) premute = v;
      c.setVolume(v === 0 ? premute || 1 : 0);
    },
    setRate: (rate) => {
      const r = clampRate(rate);
      patch({ rate: r });
      audio.defaultPlaybackRate = r;
      audio.playbackRate = r;
      deps.persist.rate(r);
    },
  };
  return { ...c, dispose: () => c.armSleep(null) };
}
