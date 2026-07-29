import { useState } from 'react';
import type { OfflineLibrary } from './offlineLibraryData';

export type OfflineSegment = 'playlists' | 'artists' | 'albums' | 'audiobooks' | 'songs';

/** The offline library segments in display order, with the count for each so
 * empty ones can be hidden — an iPod only shows categories you actually have. */
export function offlineSegments(lib: OfflineLibrary): { key: OfflineSegment; count: number }[] {
  return [
    { key: 'playlists', count: lib.playlists.length },
    { key: 'artists', count: lib.artists.length },
    { key: 'albums', count: lib.albums.length },
    { key: 'audiobooks', count: lib.audiobooks.length },
    { key: 'songs', count: lib.songs.length },
  ];
}

/** The currently selected segment, defaulting to the first non-empty one so the
 * page never opens on a blank tab. */
export function useOfflineSegment(lib: OfflineLibrary): {
  segment: OfflineSegment;
  setSegment: (s: OfflineSegment) => void;
  available: { key: OfflineSegment; count: number }[];
} {
  const available = offlineSegments(lib).filter((s) => s.count > 0);
  const [segment, setSegment] = useState<OfflineSegment>('playlists');
  const active = available.some((s) => s.key === segment)
    ? segment
    : (available[0]?.key ?? 'songs');
  return { segment: active, setSegment, available };
}
