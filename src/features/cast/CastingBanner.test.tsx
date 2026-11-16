import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./useCast', () => ({ useCast: vi.fn() }));
import { useCast } from './useCast';
import { CastingBanner } from './CastingBanner';

const stub = (over: Partial<ReturnType<typeof useCast>>) =>
  vi.mocked(useCast).mockReturnValue({
    available: true,
    status: 'off',
    connected: false,
    connecting: false,
    deviceName: '',
    cast: vi.fn(),
    stop: vi.fn(),
    ...over,
  });

describe('CastingBanner', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('is hidden when not casting', () => {
    stub({ connected: false });
    const { container } = render(<CastingBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('names the device it is casting to', () => {
    stub({ status: 'connected', connected: true, deviceName: 'Living Room TV' });
    render(<CastingBanner />);
    expect(screen.getByTestId('casting-banner')).toHaveTextContent('Casting to Living Room TV');
  });

  it('says the TV connection was lost when it drops on its own', () => {
    stub({ status: 'lost', deviceName: 'Living Room TV' });
    render(<CastingBanner />);
    expect(screen.getByTestId('casting-lost-banner')).toHaveTextContent(
      'Lost connection to Living Room TV',
    );
    expect(screen.queryByTestId('casting-banner')).toBeNull();
  });

  it('shows nothing while still connecting', () => {
    stub({ status: 'connecting', connecting: true });
    const { container } = render(<CastingBanner />);
    expect(container).toBeEmptyDOMElement();
  });
});
