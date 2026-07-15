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
import { settingsOutline, cloudDownloadOutline } from 'ionicons/icons';
import { LibraryList } from './LibraryList';
import { deezerImportEnabled } from '../../lib/runtimeConfig';

/** Your Library — one filterable list (Playlists / Albums / Artists), with
 * Liked Songs pinned as the first playlist. Requesting music now has its own
 * bottom tab (see AppTabs), so there's no request entry point here. "Import from
 * Deezer" appears only when the CadenceConfig plugin exposes the import endpoint. */
export function Library() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Your Library</IonTitle>
          <IonButtons slot="end">
            {deezerImportEnabled() && (
              <IonButton routerLink="/import/deezer" data-testid="library-import-deezer">
                <IonIcon
                  slot="icon-only"
                  icon={cloudDownloadOutline}
                  aria-label="Import from Deezer"
                />
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
