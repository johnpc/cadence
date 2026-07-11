import { Chromecast } from '@hauxir2/capacitor-chromecast';
import { castReceiverAppId } from '../../lib/runtimeConfig';
import { getCastState } from './castStore';
import { CAST_NAMESPACE, nowPlayingMessage, queueMessage } from './castMessages';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Push app state to the custom Cast receiver over the custom namespace, so it
 * can render now-playing art + a visualizer + a live queue on the TV. Every send
 * is a no-op unless we're connected AND a custom receiver is configured (the
 * default media receiver ignores these), and best-effort so a dropped message
 * never breaks playback.
 */
function canSend(): boolean {
  return getCastState().connected && castReceiverAppId() !== null;
}

async function send(message: object): Promise<void> {
  if (!canSend()) return;
  await Chromecast.sendMessage({
    namespace: CAST_NAMESPACE,
    message: JSON.stringify(message),
  }).catch(() => undefined);
}

/** Send the current track (title, artist, art, play state) to the receiver. */
export function sendNowPlaying(track: JellyfinItem, isPlaying: boolean): Promise<void> {
  return send(nowPlayingMessage(track, isPlaying));
}

/** Send the live queue (upcoming order + current index) to the receiver. */
export function sendQueue(tracks: JellyfinItem[], index: number): Promise<void> {
  return send(queueMessage(tracks, index));
}
