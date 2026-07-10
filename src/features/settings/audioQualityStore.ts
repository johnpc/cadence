/** Streaming audio quality — a cap on the transcode bitrate for the Jellyfin
 * `/universal` stream (Spotify's Data Saver / quality tiers). Persisted per
 * device. 'auto' (default) sends no cap: Jellyfin direct-plays or transcodes at
 * full quality. */
export type AudioQuality = 'auto' | 'high' | 'normal' | 'low';

/** The bitrate cap in bits/sec for each tier, or null for 'auto' (no cap). */
export const QUALITY_BITRATE: Record<AudioQuality, number | null> = {
  auto: null,
  high: 320_000,
  normal: 192_000,
  low: 96_000,
};

const KEY = 'cadence.audio-quality';
const listeners = new Set<(q: AudioQuality) => void>();

function isQuality(v: unknown): v is AudioQuality {
  return v === 'auto' || v === 'high' || v === 'normal' || v === 'low';
}

export function readAudioQuality(): AudioQuality {
  try {
    const stored = localStorage.getItem(KEY);
    return isQuality(stored) ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

export function writeAudioQuality(quality: AudioQuality): void {
  try {
    localStorage.setItem(KEY, quality);
  } catch {
    /* storage unavailable — the in-memory listeners still fire this session */
  }
  listeners.forEach((l) => l(quality));
}

export function onAudioQualityChange(listener: (q: AudioQuality) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The active bitrate cap (bits/sec), or null for no cap. Read synchronously by
 * the stream URL builder on each track load. */
export function currentBitrateCap(): number | null {
  return QUALITY_BITRATE[readAudioQuality()];
}
