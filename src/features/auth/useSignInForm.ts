import { useCallback, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from './useAuth';

/** Form state + action for Jellyfin username/password sign-in. */
export function useSignInForm() {
  const { signIn } = useAuth();
  const history = useHistory();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      await signIn(username, password);
      history.replace('/'); // let the session gate route to home
    } catch {
      setError('Incorrect username or password.');
    } finally {
      setBusy(false);
    }
  }, [username, password, signIn, history]);

  return { username, setUsername, password, setPassword, error, busy, submit };
}
