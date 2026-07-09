import { IonIcon } from '@ionic/react';
import { cloudOfflineOutline } from 'ionicons/icons';
import { useOnlineStatus } from './useOnlineStatus';
import './offlineBanner.css';

/** A slim banner shown while the device is offline, so failed loads/playback
 * read as "no connection" rather than a broken app. Cadence streams directly
 * from Jellyfin, so nothing works offline — this sets the right expectation. */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div className="offline-banner" role="status" data-testid="offline-banner">
      <IonIcon icon={cloudOfflineOutline} aria-hidden="true" />
      <span>You&rsquo;re offline — connect to reach your Jellyfin server.</span>
    </div>
  );
}
