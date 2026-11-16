import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppLoading, SessionUnavailable } from './AppLoading';

describe('AppLoading', () => {
  it('is a labelled loading status', () => {
    render(<AppLoading />);
    expect(screen.getByRole('status', { name: 'Loading Cadence' })).toBeInTheDocument();
  });

  it('SessionUnavailable explains and retries', async () => {
    const onRetry = vi.fn();
    render(<SessionUnavailable onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent("Can't open your sign-in yet.");
    await userEvent.click(screen.getByTestId('session-retry'));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
