import { IonButton, IonInput } from '@ionic/react';
import { useState } from 'react';
import { storytellerEnabled } from '../../lib/runtimeConfig';
import { useStorytellerLink } from './useStorytellerLink';
import './storytellerLink.css';

/** Settings "Storyteller" card: link this Jellyfin account to a Storyteller
 * account so audiobooks get read-along text and a position shared between
 * listening here and reading there. Only shown when the server's plugin has a
 * Storyteller bridge configured. */
export function StorytellerLink() {
  const enabled = storytellerEnabled();
  const { state, connect, disconnect } = useStorytellerLink(enabled);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  if (!enabled) return null;

  const busy = state.kind === 'loading' || state.kind === 'connecting';
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!busy && username && password) void connect(username, password);
  };

  return (
    <section className="settings__storyteller" data-testid="storyteller-card">
      <h2 className="settings__title cad-kicker">Storyteller</h2>
      <p className="cad-meta">
        Connect your Storyteller account to read along while a book plays, and to pick up where you
        left off whether you were listening or reading.
      </p>
      {state.kind === 'linked' ? (
        <div className="storyteller__linked">
          <p className="cad-body" data-testid="storyteller-linked">
            Connected as {state.username}
          </p>
          <IonButton
            size="small"
            fill="outline"
            onClick={() => void disconnect()}
            data-testid="storyteller-disconnect"
          >
            Disconnect
          </IonButton>
        </div>
      ) : (
        <form className="storyteller__form" onSubmit={submit}>
          <IonInput
            label="Storyteller username"
            labelPlacement="stacked"
            value={username}
            onIonInput={(e) => setUsername(e.detail.value ?? '')}
            autocapitalize="off"
            data-testid="storyteller-username"
          />
          <IonInput
            label="Storyteller password"
            labelPlacement="stacked"
            type="password"
            value={password}
            onIonInput={(e) => setPassword(e.detail.value ?? '')}
            data-testid="storyteller-password"
          />
          {state.kind === 'error' && (
            <p className="storyteller__error cad-meta" role="alert" data-testid="storyteller-error">
              {state.message}
            </p>
          )}
          <IonButton size="small" type="submit" disabled={busy} data-testid="storyteller-connect">
            {state.kind === 'connecting' ? 'Connecting…' : 'Connect'}
          </IonButton>
        </form>
      )}
    </section>
  );
}
