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

/** Bind the OS transport buttons to the player's actions (idempotent). */
export function bindMediaSessionHandlers(h: MediaSessionHandlers): void {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.setActionHandler('play', h.play);
  navigator.mediaSession.setActionHandler('pause', h.pause);
  navigator.mediaSession.setActionHandler('nexttrack', h.next);
  navigator.mediaSession.setActionHandler('previoustrack', h.prev);
}
