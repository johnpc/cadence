import {
  IonButtons,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { settingsOutline, addCircleOutline } from 'ionicons/icons';
import { LibraryList } from './LibraryList';
import { lidarrProxyEnabled } from '../../lib/runtimeConfig';
import { useIsAdmin } from '../auth/useIsAdmin';

/** Your Library — one filterable list (Playlists / Albums / Artists), with
 * Liked Songs pinned as the first playlist. */
export function Library() {
  // "Request music" (Lidarr) is admin-only and only when the proxy is deployed —
  // requests write to the SHARED library, so it's gated to the server operator.
  // useIsAdmin() is called unconditionally (rules of hooks) before the && gate.
  const isAdmin = useIsAdmin();
  const canRequest = lidarrProxyEnabled() && isAdmin;
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Your Library</IonTitle>
          <IonButtons slot="end">
            {canRequest && (
              <IonButton routerLink="/requests" data-testid="library-requests">
                <IonIcon slot="icon-only" icon={addCircleOutline} aria-label="Request music" />
              </IonButton>
            )}
            <IonButton routerLink="/settings" data-testid="library-settings">
              <IonIcon slot="icon-only" icon={settingsOutline} aria-label="Settings" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* The visible title lives in the toolbar (a div); give the content a
            real <h1> so screen-reader heading navigation lands here. */}
        <h1 className="cad-sr-only">Your Library</h1>
        <LibraryList />
      </IonContent>
    </IonPage>
  );
}
