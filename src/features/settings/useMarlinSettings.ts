import { useState } from 'react';
import { getMarlinUrl, getMarlinToken, setMarlin } from '../../lib/marlinStore';

/** Form state for the optional Meilisearch (marlin) search backend: the indexer
 * URL + token, seeded from the store and saved back to it. Empty URL = off
 * (native Jellyfin search). Kept out of the component for the line/CRAP gates. */
export function useMarlinSettings() {
  const [url, setUrl] = useState(getMarlinUrl);
  const [token, setToken] = useState(getMarlinToken);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setMarlin(url, token);
    setSaved(true);
  };
  // Any edit clears the "Saved" confirmation.
  const onUrl = (v: string) => {
    setUrl(v);
    setSaved(false);
  };
  const onToken = (v: string) => {
    setToken(v);
    setSaved(false);
  };

  return { url, token, saved, onUrl, onToken, save };
}
