import { useState } from 'react';
import {
  getMusicGrabberUrl,
  getMusicGrabberKey,
  setMusicGrabber,
} from '../../lib/musicGrabberStore';

/** Form state for the optional Music Grabber service: base URL + API key, seeded
 * from the store and saved back to it. Empty URL = off (Grab feature hidden).
 * Kept out of the component for the line/CRAP gates. */
export function useGrabSettings() {
  const [url, setUrl] = useState(getMusicGrabberUrl);
  const [key, setKey] = useState(getMusicGrabberKey);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setMusicGrabber(url, key);
    setSaved(true);
  };
  const onUrl = (v: string) => {
    setUrl(v);
    setSaved(false);
  };
  const onKey = (v: string) => {
    setKey(v);
    setSaved(false);
  };

  return { url, key, saved, onUrl, onKey, save };
}
