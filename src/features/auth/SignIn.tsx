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
        {/* A real form so Enter in any field submits (native behaviour). */}
        <form
          className="auth__body"
          onSubmit={(e) => {
            e.preventDefault();
            void f.submit();
          }}
        >
          <img className="auth__logo" src="/icons/icon-192.png" alt="" width={88} height={88} />
          <h1 className="auth__title cad-h1">Cadence</h1>
          <p className="auth__subtext cad-body">Sign in with your Jellyfin account.</p>
          <AuthField
            label="Server"
            type="url"
            inputMode="url"
            autoComplete="url"
            value={f.server}
            onChange={f.setServer}
            testId="signin-server"
          />
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
          <button type="submit" className="auth__cta" disabled={f.busy} data-testid="signin-submit">
            {f.busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </IonContent>
    </IonPage>
  );
}
