import { useEffect, useState } from 'react';
import {
  readAudioQuality,
  writeAudioQuality,
  onAudioQualityChange,
  type AudioQuality,
} from './audioQualityStore';

/** The audio-quality preference as reactive state + a setter, kept in sync with
 * the store so the Settings control and the stream-URL builder agree. */
export function useAudioQuality(): {
  quality: AudioQuality;
  setQuality: (q: AudioQuality) => void;
} {
  const [quality, setState] = useState<AudioQuality>(readAudioQuality);
  useEffect(() => onAudioQualityChange(setState), []);
  return { quality, setQuality: writeAudioQuality };
}
