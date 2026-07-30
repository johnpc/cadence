import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { OfflineBanner } from './OfflineBanner';
import { markReachable, markUnreachable, __resetReachability } from '../../lib/reachabilityStore';
import { writeForceOffline } from '../settings/forceOfflineStore';

const renderBanner = () =>
  render(
    <MemoryRouter>
      <OfflineBanner />
    </MemoryRouter>,
  );

afterEach(() => {
  __resetReachability();
  localStorage.clear();
});

describe('OfflineBanner', () => {
  it('renders nothing before reachability is confirmed offline (launch/pending)', () => {
    renderBanner();
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
  });

  it('renders nothing once the server is reachable', () => {
    renderBanner();
    act(() => markReachable());
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
  });

  it('shows the banner while offline, linking to the offline library', () => {
    renderBanner();
    act(() => markUnreachable());
    expect(screen.getByTestId('offline-banner')).toHaveTextContent(/offline/i);
    expect(screen.getByTestId('offline-downloads-link')).toHaveAttribute('href', '/offline');
  });

  it('shows immediately when offline mode is forced, even while reachable', () => {
    writeForceOffline(true);
    renderBanner();
    act(() => markReachable());
    expect(screen.getByTestId('offline-banner')).toHaveTextContent(/offline mode is on/i);
  });

  it('links to Settings when forced offline, so the mode can be turned back off', () => {
    writeForceOffline(true);
    renderBanner();
    act(() => markReachable());
    expect(screen.getByTestId('offline-settings-link')).toHaveAttribute('href', '/settings');
  });

  it('appears when a request fails and clears once one succeeds again', () => {
    renderBanner();
    act(() => markReachable());
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();

    act(() => markUnreachable());
    expect(screen.getByTestId('offline-banner')).toBeInTheDocument();

    act(() => markReachable());
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
  });
});
