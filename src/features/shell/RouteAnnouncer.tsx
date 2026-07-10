import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { routeLabel } from './routeLabel';

/** A visually-hidden aria-live region that speaks the page name whenever the
 * route changes — SPA navigations are otherwise silent to screen readers, so a
 * user tabbing/clicking through the app never hears where they landed. Polite
 * so it doesn't interrupt; the page's own heading still provides detail. */
export function RouteAnnouncer() {
  const { pathname } = useLocation();
  const [label, setLabel] = useState('');

  useEffect(() => {
    setLabel(`${routeLabel(pathname)} page`);
  }, [pathname]);

  return (
    <div className="cad-sr-only" role="status" aria-live="polite" data-testid="route-announcer">
      {label}
    </div>
  );
}
