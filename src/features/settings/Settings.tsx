import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { Appearance } from '../theme/Appearance';
import { useAuth } from '../auth/useAuth';
import './settings.css';

/** Settings — theme choice, the signed-in account, and sign-out. */
export function Settings() {
  const { username, signOut } = useAuth();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/library" />
          </IonButtons>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="settings">
          <Appearance />
          <section className="settings__account">
            <h2 className="settings__title cad-kicker">Account</h2>
            <p className="cad-body" data-testid="settings-username">
              Signed in as {username}
            </p>
            <button
              type="button"
              className="settings__signout"
              data-testid="settings-signout"
              onClick={() => void signOut()}
            >
              Sign out
            </button>
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
}
