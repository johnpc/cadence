import { IonIcon } from '@ionic/react';
import { cloudOfflineOutline } from 'ionicons/icons';
import { Link } from 'react-router-dom';
import { useReachability } from './useOnlineStatus';
import { useDownloads } from '../downloads/useDownloads';
import './offlineBanner.css';

/** A slim banner shown while the device is offline, so failed loads/playback
 * read as "no connection" rather than a broken app. Cadence streams from
 * Jellyfin, so most things need a connection — but downloaded tracks still play,
 * so when the user has any, point them to their offline library instead of
 * implying nothing works. Only shows on a CONFIRMED `offline` — never during the
 * launch `pending` window, so a cold start doesn't flash the banner before the
 * first request has had a chance to land. */
export function OfflineBanner() {
  const reachability = useReachability();
  const { tracks } = useDownloads();
  if (reachability !== 'offline') return null;
  return (
    <div className="offline-banner" role="status" data-testid="offline-banner">
      <IonIcon icon={cloudOfflineOutline} aria-hidden="true" />
      {tracks.length > 0 ? (
        <span>
          You&rsquo;re offline — play your{' '}
          <Link
            className="offline-banner__link"
            to="/downloads"
            data-testid="offline-downloads-link"
          >
            downloads
          </Link>
          , or connect to reach your server.
        </span>
      ) : (
        <span>You&rsquo;re offline — connect to reach your Jellyfin server.</span>
      )}
    </div>
  );
}
