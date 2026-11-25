import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { App } from '@capacitor/app';
import { parseOpenPath } from './parseDeepLink';

/**
 * Route the app when the OS opens it with a URL — a widget link
 * (`cadence://open?path=/audiobooks`) or a universal link
 * (`https://cadence.jpc.io/audiobook/…`). Listens for Capacitor's `appUrlOpen`
 * and also reads the launch URL once, for a cold start whose event fired before
 * this listener existed. Mounted at the ROOT (AppRoutes, inside the Router), not
 * in the signed-in shell: a link that arrives while signed out still moves the
 * URL, and the sign-in screen sends the user there once they sign in
 * (useSignInForm). Unknown URLs are ignored (stays put). No-op off native.
 */
export function useWidgetDeepLink(): void {
  const history = useHistory();
  useEffect(() => {
    let alive = true;
    const route = (url: string | undefined) => {
      const path = url ? parseOpenPath(url) : null;
      if (alive && path && path !== history.location.pathname + history.location.search) {
        history.push(path);
      }
    };
    void App.getLaunchUrl()
      .then((launch) => route(launch?.url))
      .catch(() => undefined);
    const handle = App.addListener('appUrlOpen', ({ url }) => route(url));
    return () => {
      alive = false;
      void handle.then((h) => h.remove());
    };
  }, [history]);
}
