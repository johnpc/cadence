import { createStoredValue } from '../../lib/store';
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

function isQuality(v: unknown): v is AudioQuality {
  return v === 'auto' || v === 'high' || v === 'normal' || v === 'low';
}

/** The chosen quality (localStorage, per-device); 'auto' when unset or junk. */
export const audioQualityStore = createStoredValue<AudioQuality>({
  key: 'cadence.audio-quality',
  parse: (raw) => (isQuality(raw) ? raw : 'auto'),
  serialize: (q) => q,
});

export const readAudioQuality = (): AudioQuality => audioQualityStore.get();
export const writeAudioQuality = (quality: AudioQuality): void => audioQualityStore.set(quality);
export const onAudioQualityChange = (listener: (q: AudioQuality) => void): (() => void) =>
  audioQualityStore.subscribe(() => listener(audioQualityStore.get()));

export function currentBitrateCap(): number | null {
  return QUALITY_BITRATE[readAudioQuality()];
}
