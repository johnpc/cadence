import { log } from '../../../lib/diagnostics/diagnosticsStore';
import { imageUrl } from '../../../lib/jellyfinStream';
import { artistLine } from '../playerFormat';
import { hasNowPlayingBridge, pushNowPlayingState } from '../../nowplaying/nowPlayingBridge';
import { NOW_PLAYING_EVENT, NOW_PLAYING_SEEK_EVENT } from '../../nowplaying/nowPlayingTypes';
import { onNowPlaying, type NowPlayingSnapshot } from './nowPlayingSnapshot';
import type { NowPlayingState } from '../../nowplaying/nowPlayingTypes';
import type { PlayerEngine } from '../engine/types';

function toNativeState(s: NowPlayingSnapshot): NowPlayingState {
  const t = s.track;
  return {
    title: t?.Name ?? '',
    artist: t ? artistLine(t) : '',
    album: t?.Album ?? '',
    artUrl: t ? imageUrl(t, 400) : null,
    isPlaying: s.isPlaying,
    position: s.position,
    duration: s.duration,
    hasTrack: !!t,
    // Published so iOS shows prev/next TRACK buttons (not ±seek).
    queueIndex: s.queueIndex,
    queueCount: s.queueCount,
  };
}

/**
 * The native iOS Now Playing bridge (MPNowPlayingInfoCenter +
 * MPRemoteCommandCenter) — what keeps Cadence the durable OS Now Playing app so
 * a Bluetooth reconnect resumes THIS queue. Pushes state when it meaningfully
 * changes (whole seconds) and maps the native `cadence:nowplaying:*` commands
 * onto the engine, logging each one BEFORE acting so device diagnostics show
 * which owner a lock-screen press reached. Inert off native iOS.
 */
export function attachNativeNowPlaying(engine: PlayerEngine): () => void {
  let last = '';
  const offPush = hasNowPlayingBridge()
    ? onNowPlaying(engine, (snap) => {
        const state = toNativeState(snap);
        const key = JSON.stringify(state);
        if (key === last) return;
        last = key;
        pushNowPlayingState(state);
      })
    : () => undefined;

  const logged = (cmd: string, fn: () => void) => () => {
    log('remote-command', cmd, { via: 'native' });
    fn();
  };
  const onSeek = (e: Event) => {
    const seconds = (e as CustomEvent<number>).detail;
    if (typeof seconds !== 'number') return;
    log('remote-command', 'seek', { via: 'native', to: String(seconds) });
    engine.seek(seconds);
  };
  const handlers: Array<[string, EventListener]> = [
    [NOW_PLAYING_EVENT.play, logged('play', engine.play)],
    [NOW_PLAYING_EVENT.pause, logged('pause', engine.pause)],
    [NOW_PLAYING_EVENT.next, logged('next', engine.next)],
    [NOW_PLAYING_EVENT.prev, logged('prev', engine.prev)],
    [NOW_PLAYING_SEEK_EVENT, onSeek],
  ];
  handlers.forEach(([evt, fn]) => window.addEventListener(evt, fn));
  return () => {
    offPush();
    handlers.forEach(([evt, fn]) => window.removeEventListener(evt, fn));
  };
}
