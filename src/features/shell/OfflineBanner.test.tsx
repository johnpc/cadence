import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OfflineBanner } from './OfflineBanner';
import { markReachable, markUnreachable, __resetReachability } from '../../lib/reachabilityStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

// Control the downloaded-tracks list the banner reads.
let downloaded: JellyfinItem[] = [];
vi.mock('../downloads/useDownloads', () => ({ useDownloads: () => ({ tracks: downloaded }) }));

const renderBanner = () =>
  render(
    <MemoryRouter>
      <OfflineBanner />
    </MemoryRouter>,
  );

afterEach(() => {
  vi.restoreAllMocks();
  downloaded = [];
  __resetReachability();
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

  it('shows the banner while offline', () => {
    renderBanner();
    act(() => markUnreachable());
    expect(screen.getByTestId('offline-banner')).toHaveTextContent(/offline/i);
  });

  it('links to downloads when the user has offline tracks', () => {
    downloaded = [{ Id: 'd1', Name: 'Saved', Type: 'Audio' }];
    renderBanner();
    act(() => markUnreachable());
    expect(screen.getByTestId('offline-downloads-link')).toHaveAttribute('href', '/downloads');
  });

  it('omits the downloads link when there are none', () => {
    renderBanner();
    act(() => markUnreachable());
    expect(screen.queryByTestId('offline-downloads-link')).not.toBeInTheDocument();
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
