import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OfflineBanner } from './OfflineBanner';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

// Control the downloaded-tracks list the banner reads.
let downloaded: JellyfinItem[] = [];
vi.mock('../downloads/useDownloads', () => ({ useDownloads: () => ({ tracks: downloaded }) }));

function setOnline(value: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value);
}

const renderBanner = () =>
  render(
    <MemoryRouter>
      <OfflineBanner />
    </MemoryRouter>,
  );

afterEach(() => {
  vi.restoreAllMocks();
  downloaded = [];
});

describe('OfflineBanner', () => {
  it('renders nothing while online', () => {
    setOnline(true);
    renderBanner();
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
  });

  it('shows the banner while offline', () => {
    setOnline(false);
    renderBanner();
    expect(screen.getByTestId('offline-banner')).toHaveTextContent(/offline/i);
  });

  it('links to downloads when the user has offline tracks', () => {
    setOnline(false);
    downloaded = [{ Id: 'd1', Name: 'Saved', Type: 'Audio' }];
    renderBanner();
    expect(screen.getByTestId('offline-downloads-link')).toHaveAttribute('href', '/downloads');
  });

  it('omits the downloads link when there are none', () => {
    setOnline(false);
    renderBanner();
    expect(screen.queryByTestId('offline-downloads-link')).not.toBeInTheDocument();
  });

  it('appears and disappears as connectivity changes', () => {
    setOnline(true);
    renderBanner();
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();

    setOnline(false);
    act(() => window.dispatchEvent(new Event('offline')));
    expect(screen.getByTestId('offline-banner')).toBeInTheDocument();

    setOnline(true);
    act(() => window.dispatchEvent(new Event('online')));
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
  });
});
