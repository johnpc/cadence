import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

/** Home — recommendation shelves land here (slice 7). Placeholder for now. */
export function Home() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Cadence</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p className="cad-body" data-testid="home-placeholder">
          Your recommendations will live here.
        </p>
      </IonContent>
    </IonPage>
  );
}
