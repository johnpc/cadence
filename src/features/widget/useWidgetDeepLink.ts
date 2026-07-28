import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { App } from '@capacitor/app';
import { parseOpenPath } from './parseDeepLink';

/**
 * Route the app when it's opened via a widget/deep link
 * (`cadence://open?path=/audiobooks`). Listens for Capacitor's `appUrlOpen`
 * (fired when the OS hands the app a URL) and pushes the parsed in-app path.
 * Must live inside the Router (so useHistory works) and only when signed in —
 * mount it in AppTabs. A malformed/unknown URL is ignored (stays put).
 */
export function useWidgetDeepLink(): void {
  const history = useHistory();
  useEffect(() => {
    const handle = App.addListener('appUrlOpen', ({ url }) => {
      const path = parseOpenPath(url);
      if (path) history.push(path);
    });
    return () => {
      void handle.then((h) => h.remove());
    };
  }, [history]);
}
