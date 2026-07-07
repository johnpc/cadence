import { IonContent, IonPage } from '@ionic/react';
import { AuthField } from './AuthField';
import { useSignInForm } from './useSignInForm';
import './auth.css';

/** Jellyfin username/password sign-in. */
export function SignIn() {
  const f = useSignInForm();

  return (
    <IonPage>
      <IonContent fullscreen className="auth">
        <div className="auth__body">
          <h1 className="auth__title cad-h1">Cadence</h1>
          <p className="auth__subtext cad-body">Sign in with your Jellyfin account.</p>
          <AuthField
            label="Username"
            type="text"
            inputMode="text"
            autoComplete="username"
            value={f.username}
            onChange={f.setUsername}
            testId="signin-username"
          />
          <AuthField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={f.password}
            onChange={f.setPassword}
            testId="signin-password"
          />
          {f.error && (
            <p className="auth__error" data-testid="signin-error">
              {f.error}
            </p>
          )}
          <button
            type="button"
            className="auth__cta"
            disabled={f.busy}
            data-testid="signin-submit"
            onClick={f.submit}
          >
            {f.busy ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
}
