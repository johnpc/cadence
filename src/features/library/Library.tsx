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
import { settingsOutline } from 'ionicons/icons';
import { LibraryList } from './LibraryList';

/** Your Library — one filterable list (Playlists / Albums / Artists), with
 * Liked Songs pinned as the first playlist. */
export function Library() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Your Library</IonTitle>
          <IonButtons slot="end">
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
