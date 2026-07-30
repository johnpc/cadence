import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { settingsOutline } from 'ionicons/icons';
import { OfflineLibrary } from './OfflineLibrary';

/** The offline library as its own page/tab: an iPod-style browser of downloaded
 * content that needs no server. Reached from the offline banner and shown as the
 * library surface while offline mode is active. Carries its OWN Settings gear:
 * offline mode hides the Library tab (where Settings normally lives), so without
 * this the "Offline mode" toggle would be unreachable — you could never turn it
 * back off. Settings is offline-safe (reads local prefs only). */
export function OfflineLibraryPage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Offline</IonTitle>
          <IonButtons slot="end">
            <IonButton routerLink="/settings" data-testid="offline-settings">
              <IonIcon slot="icon-only" icon={settingsOutline} aria-label="Settings" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1 className="cad-sr-only">Offline library</h1>
        <OfflineLibrary />
      </IonContent>
    </IonPage>
  );
}
