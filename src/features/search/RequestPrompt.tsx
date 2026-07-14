import { IonButton, IonIcon } from '@ionic/react';
import { addCircleOutline } from 'ionicons/icons';
import { lidarrProxyEnabled } from '../../lib/runtimeConfig';
import { useIsAdmin } from '../auth/useIsAdmin';
import './requestPrompt.css';

/** "Can't find it? Request it" — shown under an empty Search when the request
 * feature is available (admin + the Lidarr proxy is deployed). Links to the
 * Requests screen pre-filled with the query, so a fruitless search flows
 * straight into requesting the missing music. Renders nothing otherwise. */
export function RequestPrompt({ query, show }: { query: string; show: boolean }) {
  const isAdmin = useIsAdmin();
  if (!show || !query.trim() || !lidarrProxyEnabled() || !isAdmin) return null;
  return (
    <div className="request-prompt" data-testid="search-request-prompt">
      <p className="request-prompt__text cad-meta">Not in your library?</p>
      <IonButton
        size="small"
        fill="outline"
        routerLink={`/requests?q=${encodeURIComponent(query.trim())}`}
        data-testid="search-request-cta"
      >
        <IonIcon slot="start" icon={addCircleOutline} />
        Request “{query.trim()}”
      </IonButton>
    </div>
  );
}
