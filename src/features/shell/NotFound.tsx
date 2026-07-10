import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import './notFound.css';

/** The catch-all page for any unknown route (a stale bookmark, a deleted
 * playlist link, a mistyped URL) — a friendly dead-end with a way back home,
 * instead of a blank router outlet. */
export function NotFound() {
  const history = useHistory();
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Not found</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="not-found" data-testid="not-found">
          <p className="not-found__code cad-headline">404</p>
          <h1 className="not-found__title cad-headline-sm">We couldn&rsquo;t find that page</h1>
          <p className="not-found__message cad-meta">
            The link may be broken, or the page may have been removed.
          </p>
          <button
            type="button"
            className="not-found__home"
            data-testid="not-found-home"
            onClick={() => history.replace('/home')}
          >
            Go home
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
}
