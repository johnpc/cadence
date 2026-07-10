import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./useCast', () => ({ useCast: vi.fn() }));
import { useCast } from './useCast';
import { CastingBanner } from './CastingBanner';

const stub = (over: Partial<ReturnType<typeof useCast>>) =>
  vi.mocked(useCast).mockReturnValue({
    available: true,
    connected: false,
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
    stub({ connected: true, deviceName: 'Living Room TV' });
    render(<CastingBanner />);
    expect(screen.getByTestId('casting-banner')).toHaveTextContent('Casting to Living Room TV');
  });
});
