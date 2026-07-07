import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

/** Your Library — liked songs + playlists (slices 5–6). Placeholder for now. */
export function Library() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Your Library</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p className="cad-body" data-testid="library-placeholder">
          Songs and playlists you add will live here.
        </p>
      </IonContent>
    </IonPage>
  );
}
