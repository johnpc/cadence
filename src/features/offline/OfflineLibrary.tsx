import { IonSegment, IonSegmentButton, IonLabel } from '@ionic/react';
import { LoadState } from '../../components/LoadState';
import { useOfflineLibrary } from './useOfflineLibrary';
import { useOfflineSegment, type OfflineSegment } from './useOfflineSegment';
import { OfflineSegmentView } from './OfflineSegmentView';
import './offlineLibrary.css';

const LABELS: Record<OfflineSegment, string> = {
  playlists: 'Playlists',
  artists: 'Artists',
  albums: 'Albums',
  audiobooks: 'Audiobooks',
  songs: 'Songs',
};

/** The iPod-style offline library: browse ONLY your downloaded content — songs,
 * albums, artists, playlists, audiobooks — fully driven by what's on the device,
 * with no backend connection. A segment bar (only the categories you actually
 * have) switches between them. Shown when offline mode is on / the server is
 * unreachable. */
export function OfflineLibrary() {
  const lib = useOfflineLibrary();
  const { segment, setSegment, available } = useOfflineSegment(lib);
  return (
    <LoadState
      isLoading={false}
      isEmpty={available.length === 0}
      emptyTitle="Nothing downloaded yet"
      emptyMessage="Download songs, albums, playlists, or audiobooks to listen offline. Tap the download icon on anything to save it here."
    >
      <div className="offline-library" data-testid="offline-library">
        <IonSegment
          value={segment}
          scrollable
          onIonChange={(e) => setSegment(e.detail.value as OfflineSegment)}
          data-testid="offline-segment"
        >
          {available.map((s) => (
            <IonSegmentButton key={s.key} value={s.key} data-testid={`offline-seg-${s.key}`}>
              <IonLabel>
                {LABELS[s.key]} ({s.count})
              </IonLabel>
            </IonSegmentButton>
          ))}
        </IonSegment>
        <OfflineSegmentView segment={segment} lib={lib} />
      </div>
    </LoadState>
  );
}
