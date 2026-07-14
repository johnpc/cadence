import { IonIcon, useIonRouter } from '@ionic/react';
import {
  home,
  search,
  library,
  addCircleOutline,
  chevronBack,
  chevronForward,
} from 'ionicons/icons';
import { useLocation } from 'react-router-dom';
import { LibraryList } from './LibraryList';
import { useSidebarCollapsed } from './useSidebarCollapsed';
import { lidarrProxyEnabled } from '../../lib/runtimeConfig';
import './desktopSidebar.css';

const NAV = [
  { to: '/home', icon: home, label: 'Home', testid: 'nav-home' },
  { to: '/search', icon: search, label: 'Search', testid: 'nav-search' },
  { to: '/library', icon: library, label: 'Your Library', testid: 'nav-library' },
];

// "Requests" is only reachable when the deploy enables the Lidarr proxy — mirror
// the mobile tab bar (AppTabs) so desktop users have the same entry point.
const REQUESTS_NAV = {
  to: '/requests',
  icon: addCircleOutline,
  label: 'Requests',
  testid: 'nav-requests',
};

/** Spotify-style persistent left sidebar, shown only at desktop widths (CSS).
 * Top: primary nav + a collapse toggle. Below: the full Your Library list.
 * Collapsed, it becomes an icons-only rail so the main area gets more room. */
export function DesktopSidebar() {
  const { collapsed, toggle } = useSidebarCollapsed();
  const nav = lidarrProxyEnabled() ? [...NAV, REQUESTS_NAV] : NAV;
  const { pathname } = useLocation();
  const router = useIonRouter();
  return (
    <aside
      className={collapsed ? 'sidebar sidebar--collapsed' : 'sidebar'}
      data-testid="desktop-sidebar"
    >
      <button
        type="button"
        className="sidebar__collapse"
        data-testid="sidebar-collapse"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        onClick={toggle}
      >
        <IonIcon icon={collapsed ? chevronForward : chevronBack} aria-hidden="true" />
      </button>
      <nav className="sidebar__nav">
        {nav.map((n) => (
          // Navigate PROGRAMMATICALLY via useIonRouter (root direction) rather
          // than a declarative IonRouterLink. A routerLink click intercepted
          // while the IonRouterOutlet is still settling — e.g. the just-mounted
          // shell right after sign-in — was silently dropped, leaving the app on
          // the previous tab (~30% of the time, no contention needed).
          // router.push imperatively drives the outlet, so the nav always lands.
          <button
            key={n.to}
            type="button"
            className={
              pathname.startsWith(n.to) ? 'sidebar__link sidebar__link--on' : 'sidebar__link'
            }
            data-testid={n.testid}
            title={n.label}
            onClick={() => router.push(n.to, 'root', 'replace')}
          >
            <IonIcon icon={n.icon} aria-hidden="true" />
            <span className="sidebar__label">{n.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar__library">
        <LibraryList />
      </div>
    </aside>
  );
}
