import { useEffect, useState } from 'react';
import { readIndex } from '../downloads/downloadIndex';
import { onDownloadsChange } from '../downloads/downloadStore';
import { readOfflinePlaylists } from './offlinePlaylistStore';
import { buildOfflineLibrary, type OfflineLibrary } from './offlineLibraryData';

/** The iPod-style offline library — albums/artists/playlists/audiobooks/songs
 * derived entirely from downloaded content, as reactive state. Rebuilds on every
 * download add/remove (and playlist save/forget, which ride the same emitter) so
 * the offline browser stays in sync with NO server round-trip. */
export function useOfflineLibrary(): OfflineLibrary {
  const [lib, setLib] = useState<OfflineLibrary>(() =>
    buildOfflineLibrary(readIndex(), readOfflinePlaylists()),
  );
  useEffect(
    () => onDownloadsChange(() => setLib(buildOfflineLibrary(readIndex(), readOfflinePlaylists()))),
    [],
  );
  return lib;
}
