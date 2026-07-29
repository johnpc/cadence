import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { OfflineLibrary } from './OfflineLibrary';

/** The offline library as its own page/tab: an iPod-style browser of downloaded
 * content that needs no server. Reached from the offline banner and shown as the
 * library surface while offline mode is active. */
export function OfflineLibraryPage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Offline</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1 className="cad-sr-only">Offline library</h1>
        <OfflineLibrary />
      </IonContent>
    </IonPage>
  );
}
