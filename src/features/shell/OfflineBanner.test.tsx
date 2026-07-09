import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OfflineBanner } from './OfflineBanner';

function setOnline(value: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('OfflineBanner', () => {
  it('renders nothing while online', () => {
    setOnline(true);
    render(<OfflineBanner />);
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
  });

  it('shows the banner while offline', () => {
    setOnline(false);
    render(<OfflineBanner />);
    expect(screen.getByTestId('offline-banner')).toHaveTextContent(/offline/i);
  });

  it('appears and disappears as connectivity changes', () => {
    setOnline(true);
    render(<OfflineBanner />);
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();

    setOnline(false);
    act(() => window.dispatchEvent(new Event('offline')));
    expect(screen.getByTestId('offline-banner')).toBeInTheDocument();

    setOnline(true);
    act(() => window.dispatchEvent(new Event('online')));
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument();
  });
});
