import { useCallback, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { getServerUrl, setServerUrl } from '../../lib/serverUrlStore';

/** Form state + action for Jellyfin username/password sign-in, including the
 * server URL (persisted before authenticating so the request hits it). */
export function useSignInForm() {
  const { signIn } = useAuth();
  const history = useHistory();
  // Where the user was headed when the sign-in gate intercepted them — so a
  // shared deep link (e.g. /album/123 opened while signed out) lands there after
  // sign-in instead of always dumping them on Home. Captured once at mount (the
  // gate renders SignIn at the target URL); '/' when they just opened the app.
  const dest = useRef(useLocation().pathname);
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
      // Return to the intended deep link; '/' (→ home) for a plain app open.
      history.replace(dest.current || '/');
    } catch {
      setError('Check your server address, username, and password.');
    } finally {
      setBusy(false);
    }
  }, [server, username, password, signIn, history]);

  return { server, setServer, username, setUsername, password, setPassword, error, busy, submit };
}
