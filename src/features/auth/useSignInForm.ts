import { useCallback, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { getServerUrl, setServerUrl } from '../../lib/serverUrlStore';

export type SignInStatus = { kind: 'editing'; error: string | null } | { kind: 'signing-in' };

/** Form state + action for Jellyfin username/password sign-in, including the
 * server URL (persisted before authenticating so the request hits it). */
export function useSignInForm() {
  const { signIn } = useAuth();
  const history = useHistory();
  // Where the user was headed when the sign-in gate intercepted them — so a
  // shared deep link (e.g. /album/123 opened while signed out) lands there after
  // sign-in instead of always dumping them on Home. Follows the URL while the
  // form is up: a universal link that opens the app AFTER the sign-in screen is
  // showing moves the URL (useWidgetDeepLink) and must still win. '/' when they
  // just opened the app.
  const location = useLocation();
  const dest = useRef('/');
  dest.current = `${location.pathname}${location.search}`;
  const [server, setServer] = useState(getServerUrl());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // ONE submit state: editing (optionally showing why the last try failed) or
  // signing in. A ref mirrors "signing in" so a double Enter can't fire twice.
  const [status, setStatus] = useState<SignInStatus>({ kind: 'editing', error: null });
  const submitting = useRef(false);

  const submit = useCallback(async () => {
    if (submitting.current) return;
    if (!server.trim()) {
      setStatus({ kind: 'editing', error: 'Enter your server address.' });
      return;
    }
    submitting.current = true;
    setStatus({ kind: 'signing-in' });
    setServerUrl(server); // point the client at this server before we call it
    const startPath = history.location.pathname;
    try {
      await signIn(username, password);
      // signIn resolves only after the post-auth refresh (token validation +
      // plugin config), which over a cold tunnel lands seconds AFTER the shell
      // has rendered. If the user already moved on (tapped a tab), don't yank
      // them back. Otherwise return to the intended deep link, or '/' (→ home).
      if (history.location.pathname === startPath) history.replace(dest.current || '/');
      setStatus({ kind: 'editing', error: null });
    } catch {
      setStatus({ kind: 'editing', error: 'Check your server address, username, and password.' });
    } finally {
      submitting.current = false;
    }
  }, [server, username, password, signIn, history]);

  const error = status.kind === 'editing' ? status.error : null;
  const busy = status.kind === 'signing-in';
  return { server, setServer, username, setUsername, password, setPassword, error, busy, submit };
}
