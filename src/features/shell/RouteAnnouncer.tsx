import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { routeLabel } from './routeLabel';

/** A visually-hidden aria-live region that speaks the page name whenever the
 * route changes — SPA navigations are otherwise silent to screen readers, so a
 * user tabbing/clicking through the app never hears where they landed. Polite
 * so it doesn't interrupt; the page's own heading still provides detail. */
export function RouteAnnouncer({ override }: { override?: string } = {}) {
  const { pathname } = useLocation();
  const [label, setLabel] = useState('');

  useEffect(() => {
    // `override` wins when the shell renders a fixed screen regardless of path
    // (e.g. Sign in / Loading while signed out) — otherwise announce the route.
    setLabel(`${override ?? routeLabel(pathname)} page`);
  }, [pathname, override]);

  return (
    <div className="cad-sr-only" role="status" aria-live="polite" data-testid="route-announcer">
      {label}
    </div>
  );
}
