import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';

/** Search — the primary discovery surface (slice 4). Placeholder for now. */
export function Search() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Search</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <p className="cad-body" data-testid="search-placeholder">
          Search your library.
        </p>
      </IonContent>
    </IonPage>
  );
}
