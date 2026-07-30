import { IonIcon } from '@ionic/react';
import { cloudOfflineOutline } from 'ionicons/icons';
import { Link } from 'react-router-dom';
import { useReachability } from './useOnlineStatus';
import { useForceOffline } from '../settings/useForceOffline';
import './offlineBanner.css';

/** A slim banner shown while the app is offline (the server is unreachable OR
 * the user forced offline mode in Settings), so failed loads read as "no
 * connection" rather than a broken app. Points to the iPod-style offline library
 * of downloaded content. Never shows during the launch `pending` window, so a
 * cold start doesn't flash the banner before the first request can land — unless
 * offline mode is forced, which is intentional and immediate. */
export function OfflineBanner() {
  const reachability = useReachability();
  const { forceOffline } = useForceOffline();
  if (!forceOffline && reachability !== 'offline') return null;
  return (
    <div className="offline-banner" role="status" data-testid="offline-banner">
      <IonIcon icon={cloudOfflineOutline} aria-hidden="true" />
      <span>
        {forceOffline ? 'Offline mode is on' : 'You’re offline'} — browse your{' '}
        <Link className="offline-banner__link" to="/offline" data-testid="offline-downloads-link">
          downloads
        </Link>
        {forceOffline ? (
          <>
            , or turn it off in{' '}
            <Link
              className="offline-banner__link"
              to="/settings"
              data-testid="offline-settings-link"
            >
              Settings
            </Link>
            .
          </>
        ) : (
          ', or connect to reach your server.'
        )}
      </span>
    </div>
  );
}
