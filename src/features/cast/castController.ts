import { Capacitor } from '@capacitor/core';
import { Chromecast } from '@hauxir2/capacitor-chromecast';
import { audioStreamUrl, imageUrl } from '../../lib/jellyfinStream';
import { castReceiverAppId } from '../../lib/runtimeConfig';
import { setCastState, getCastState } from './castStore';
import { setCastProgress } from './castProgress';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Shape of the MEDIA_UPDATE event payload we read for the receiver's position.
 * (Only the fields we use; the plugin's MediaObject has more.) */
interface MediaUpdate {
  currentTime?: number;
  media?: { duration?: number };
}

/**
 * Thin wrapper over the Chromecast plugin. Casts a Jellyfin track's audio to a
 * TV (e.g. an Nvidia Shield) using the default media receiver. Playback then
 * lives on the receiver; the app proxies transport to it. Session state is kept
 * in castStore so the UI reacts. MVP is native-only (the Cast device picker is a
 * native dialog); the web SDK path is left for a later phase.
 */
let initialized = false;

/** Cast is offered only where it's reliable for the MVP: the native app, whose
 * requestSession() shows the OS Cast picker. */
export function isCastAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

async function ensureInitialized(): Promise<void> {
  if (initialized) return;
  // When a custom receiver app id is configured, initialize with it so casting
  // launches OUR receiver (visualizer/lyrics/queue on the TV); otherwise the
  // plugin uses the default media receiver (audio only) — unchanged behaviour.
  const appId = castReceiverAppId();
  await Chromecast.initialize({
    autoJoinPolicy: 'origin_scoped',
    ...(appId ? { appId } : {}),
  });
  Chromecast.addListener('SESSION_ENDED', () => {
    setCastState({ connected: false, deviceName: '', playing: false });
    setCastProgress({ position: 0, duration: 0 });
  });
  // Mirror the receiver's playback position so the app's scrubber tracks the TV.
  Chromecast.addListener('MEDIA_UPDATE', (e: MediaUpdate) => {
    setCastProgress({ position: e?.currentTime ?? 0, duration: e?.media?.duration ?? 0 });
  });
  initialized = true;
}

/** Start (or retarget) a cast session and load the given track on the TV. Shows
 * the native device picker on the first call. */
export async function castTrack(track: JellyfinItem): Promise<void> {
  await ensureInitialized();
  const prev = getCastState();
  if (!prev.connected) {
    const session = await Chromecast.requestSession();
    setCastState({
      connected: true,
      deviceName: session.receiver?.friendlyName ?? 'TV',
      playing: true,
    });
  }
  const art = imageUrl(track, 600);
  await Chromecast.loadMedia({
    contentId: audioStreamUrl(track.Id),
    contentType: 'audio/*',
    streamType: 'BUFFERED',
    autoPlay: true,
    metadata: {
      title: track.Name,
      subtitle: track.Artists?.join(', ') ?? '',
      images: art ? [{ url: art }] : [],
    },
  });
}

/** Toggle play/pause on the receiver, tracking the state for the UI. */
export async function castToggle(): Promise<void> {
  const s = getCastState();
  if (s.playing) await Chromecast.mediaPause();
  else await Chromecast.mediaPlay();
  setCastState({ ...s, playing: !s.playing });
}

export const castSeek = (seconds: number): Promise<void> =>
  Chromecast.mediaSeek({ currentTime: seconds });

/** End the session and stop casting on the receiver. */
export async function stopCast(): Promise<void> {
  try {
    await Chromecast.sessionStop();
  } finally {
    setCastState({ connected: false, deviceName: '', playing: false });
  }
}
