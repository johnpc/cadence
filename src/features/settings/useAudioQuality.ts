import { useStore } from '../../lib/store';
import { audioQualityStore, writeAudioQuality, type AudioQuality } from './audioQualityStore';

/** The audio-quality preference as reactive state + a setter, kept in sync with
 * the store so the Settings control and the stream-URL builder agree. */
export function useAudioQuality(): {
  quality: AudioQuality;
  setQuality: (q: AudioQuality) => void;
} {
  return { quality: useStore(audioQualityStore), setQuality: writeAudioQuality };
}
