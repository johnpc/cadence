/**
 * W3C MediaSession bridge — publishes now-playing metadata + wires the OS
 * transport controls (lock screen, Control Center, Bluetooth) to the player.
 * Works in the PWA and in the iOS WKWebView (with the .playback audio session
 * set in AppDelegate). No-ops where the API is unavailable.
 */
import { imageUrl } from '../../lib/jellyfinStream';
import { artistLine } from './playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

export interface MediaSessionHandlers {
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  /** Seek to an absolute position in seconds (lock-screen scrubber). */
  seek: (seconds: number) => void;
}

/** Publish the current track's metadata to the OS now-playing UI. */
export function setNowPlaying(track: JellyfinItem | null): void {
  if (!('mediaSession' in navigator)) return;
  if (!track) {
    navigator.mediaSession.metadata = null;
    return;
  }
  const art = imageUrl(track, 512);
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.Name,
    artist: artistLine(track),
    album: track.Album ?? '',
    artwork: art ? [{ src: art, sizes: '512x512', type: 'image/jpeg' }] : [],
  });
}

/** Reflect play/pause state in the OS UI. */
export function setPlaybackState(isPlaying: boolean): void {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
}

const SEEK_STEP = 10; // seconds, for the ±skip lock-screen buttons

/** Bind the OS transport buttons to the player's actions (idempotent), incl.
 * absolute seek + ±10s skip for the lock-screen/Control-Center scrubber. A
 * handler set to null (unsupported action) is ignored by the OS. */
export function bindMediaSessionHandlers(h: MediaSessionHandlers): void {
  if (!('mediaSession' in navigator)) return;
  const ms = navigator.mediaSession;
  ms.setActionHandler('play', h.play);
  ms.setActionHandler('pause', h.pause);
  ms.setActionHandler('nexttrack', h.next);
  ms.setActionHandler('previoustrack', h.prev);
  ms.setActionHandler('seekto', (e) => {
    if (typeof e.seekTime === 'number') h.seek(e.seekTime);
  });
  ms.setActionHandler('seekbackward', (e) => h.seek(current() - (e.seekOffset || SEEK_STEP)));
  ms.setActionHandler('seekforward', (e) => h.seek(current() + (e.seekOffset || SEEK_STEP)));
}

// The player's live position, updated by setPositionState so the relative
// ±skip handlers seek from the right place.
let current = () => 0;

/** Publish playback position/duration to the OS so the lock screen shows an
 * accurate, scrubbable progress bar. Guards against the invalid states the API
 * rejects (non-finite, position > duration). */
export function setPositionState(position: number, duration: number): void {
  if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
  current = () => position;
  if (!Number.isFinite(duration) || duration <= 0) return;
  try {
    navigator.mediaSession.setPositionState({
      duration,
      position: Math.min(Math.max(position, 0), duration),
    });
  } catch {
    // Some engines throw on transient bad values — ignore; next tick recovers.
  }
}
