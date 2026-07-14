import { useState } from 'react';
import {
  getMarlinUrl,
  getMarlinToken,
  setMarlin,
  marlinManagedByServer,
} from '../../lib/marlinStore';

/** Form state for the optional Meilisearch (marlin) search backend: the indexer
 * URL + token, seeded from the store and saved back to it. Empty URL = off
 * (native Jellyfin search). When `managed` is true the server (runtime config /
 * CadenceConfig plugin) has set the URL — it supersedes the user's choice and the
 * Settings fields are read-only. Kept out of the component for the line/CRAP gates. */
export function useMarlinSettings() {
  const managed = marlinManagedByServer();
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

  return { url, token, saved, managed, onUrl, onToken, save };
}
