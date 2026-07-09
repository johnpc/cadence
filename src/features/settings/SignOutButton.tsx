import { IonAlert } from '@ionic/react';
import { useState } from 'react';
import { useAuth } from '../auth/useAuth';

/** Sign-out with a confirmation step — signing out drops the session (and, on a
 * shared build, the server the user typed), so it's worth a guard against an
 * accidental tap. Kept separate so Settings stays render-thin. */
export function SignOutButton() {
  const { signOut } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="settings__signout"
        data-testid="settings-signout"
        onClick={() => setConfirmOpen(true)}
      >
        Sign out
      </button>
      <IonAlert
        isOpen={confirmOpen}
        header="Sign out?"
        message="You'll need your Jellyfin username and password to sign back in."
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          { text: 'Sign out', role: 'destructive', handler: () => void signOut() },
        ]}
        onDidDismiss={() => setConfirmOpen(false)}
      />
    </>
  );
}
