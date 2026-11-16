import { watch } from '../../../lib/store';
import { currentTrack } from '../queue';
import { isPlayingState } from '../engine/transitions';
import {
  bindMediaSessionHandlers,
  setNowPlaying,
  setPlaybackState,
  setPositionState,
} from '../mediaSession';
import type { PlayerEngine } from '../engine/types';

/**
 * Keep the W3C MediaSession (lock screen, Control Center, Bluetooth, the PWA
 * media notification) in sync with the engine and bind its transport.
 *
 * Publishes EVERYTHING even inside the native iOS app, where NowPlayingBridge
 * also writes MPNowPlayingInfoCenter: WebKit auto-writes the one Now Playing
 * surface whenever <audio> plays and that cannot be disabled, so a sparse web
 * write landing after the native one hid next/prev. Both writers describe the
 * same state, so their racing is invisible. Handlers are DIRECTIONAL play/pause
 * (never a toggle) and are re-bound on every track change, because WebKit can
 * drop them when its media session takes over.
 */
export function attachMediaSession(engine: PlayerEngine): () => void {
  const handlers = {
    play: engine.play,
    pause: engine.pause,
    next: engine.next,
    prev: engine.prev,
    seek: engine.seek,
  };
  const offTrack = watch(
    engine.state,
    (s) => currentTrack(s.queue),
    (track) => {
      setNowPlaying(track);
      bindMediaSessionHandlers(handlers);
    },
    { immediate: true },
  );
  const offPlaying = watch(engine.state, isPlayingState, (playing) => setPlaybackState(playing), {
    immediate: true,
  });
  const publishPosition = () => {
    const { position, duration } = engine.progress.get();
    setPositionState(position, duration, engine.state.get().rate);
  };
  const offProgress = engine.progress.subscribe(publishPosition);
  // A speed change must reach the lock screen even while paused (no ticks then).
  const offRate = watch(engine.state, (s) => s.rate, publishPosition);
  return () => {
    offTrack();
    offPlaying();
    offProgress();
    offRate();
  };
}
