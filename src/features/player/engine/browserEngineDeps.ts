import { log } from '../../../lib/diagnostics/diagnosticsStore';
import { adoptPlaybackAudioSession } from '../../../lib/webAudioSession';
import { notifyNativePlaybackStarted } from '../../../lib/nativeAudioSession';
import { getSession, onSessionChange } from '../../../lib/sessionStore';
import { random } from '../../../lib/random';
import { tap } from '../../../lib/haptics';
import { isCastConnected, isCastPlaying, onCastStateChange } from '../../cast/castStore';
import { castSeek, castToggle, castTrack, stopCast } from '../../cast/castController';
import { storytellerResumeSeconds } from '../../readalong/storytellerResume';
import { loadQueue, saveQueue } from '../queuePersistence';
import { loadModes, saveModes } from '../playerModes';
import { loadRate, loadVolume, saveRate, saveVolume } from '../playbackPrefs';
import { resolveTrackSrc } from '../startPlayback';
import { getReachability } from '../../../lib/reachabilityStore';
import { readForceOffline } from '../../settings/forceOfflineStore';
import { isDownloaded } from '../../downloads/downloadStore';
import { probeServer } from '../../../lib/serverProbe';
import type { EngineDeps } from './types';

/** How long a buffering stall may last before recovery. 45 s is the measured
 * worst case for a cold remote transcode — a shorter budget (20 s) "recovered"
 * streams that were about to succeed, restarting or skipping a good track. */
export const STALL_TIMEOUT_MS = 45_000;

/**
 * The real platform for the engine: an HTMLAudioElement attached (hidden) to the
 * DOM so OS media controls and e2e can see it, the iOS playback audio session,
 * localStorage preferences, the session store, the Cast plugin, and toasts.
 */
export function browserEngineDeps(notify: (message: string) => void): EngineDeps {
  const audio = new Audio();
  const modes = loadModes();
  return {
    audio,
    attach: () => {
      // Declare this page a playback app to WebKit (iOS 17+): without it the
      // WKWebView is suspended in the silent gap between tracks in background.
      log('audio-session', 'adopt playback', { ok: String(adoptPlaybackAudioSession()) });
      if (audio.parentNode) return;
      audio.setAttribute('hidden', '');
      document.body.appendChild(audio);
    },
    initial: {
      queue: loadQueue(),
      shuffle: modes.shuffle,
      repeat: modes.repeat,
      volume: loadVolume(),
      rate: loadRate(),
    },
    persist: { queue: saveQueue, modes: saveModes, volume: saveVolume, rate: saveRate },
    resolveSrc: resolveTrackSrc,
    session: { userId: () => getSession()?.userId ?? '', subscribe: onSessionChange },
    cast: {
      connected: () => isCastConnected(),
      playing: () => isCastPlaying(),
      subscribe: onCastStateChange,
      load: castTrack,
      toggle: castToggle,
      seek: castSeek,
      stop: stopCast,
    },
    // Live Jellyfin position, with a newer Storyteller (read-along) one winning.
    resumeAt: storytellerResumeSeconds,
    availability: {
      offline: () => readForceOffline() || getReachability() === 'offline',
      downloaded: isDownloaded,
      probe: () => probeServer(),
    },
    notify,
    haptic: () => tap(),
    onAudible: () => notifyNativePlaybackStarted(),
    random,
    log,
    stallTimeoutMs: STALL_TIMEOUT_MS,
  };
}
