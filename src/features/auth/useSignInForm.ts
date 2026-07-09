import { useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from './useAuth';
import { getServerUrl, setServerUrl } from '../../lib/serverUrlStore';

/** Form state + action for Jellyfin username/password sign-in, including the
 * server URL (persisted before authenticating so the request hits it). */
export function useSignInForm() {
  const { signIn } = useAuth();
  const history = useHistory();
  const [server, setServer] = useState(getServerUrl());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(async () => {
    if (!server.trim()) {
      setError('Enter your Jellyfin server address.');
      return;
    }
    setError(null);
    setBusy(true);
    setServerUrl(server); // point the client at this server before we call it
    try {
      await signIn(username, password);
      history.replace('/'); // let the session gate route to home
    } catch {
      setError('Check your server address, username, and password.');
    } finally {
      setBusy(false);
    }
  }, [server, username, password, signIn, history]);

  return { server, setServer, username, setUsername, password, setPassword, error, busy, submit };
}
