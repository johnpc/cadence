import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SleepIndicator } from './SleepIndicator';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';

describe('SleepIndicator', () => {
  it('renders nothing when no timer is armed', () => {
    const { container } = renderWithProviders(<SleepIndicator />, {
      player: stubPlayer({ sleepMode: null }),
    });
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the armed timer label', () => {
    renderWithProviders(<SleepIndicator />, { player: stubPlayer({ sleepMode: 30 }) });
    expect(screen.getByTestId('sleep-indicator')).toHaveTextContent('Sleep in 30 min');
  });

  it('shows the end-of-track label', () => {
    renderWithProviders(<SleepIndicator />, { player: stubPlayer({ sleepMode: 'track' }) });
    expect(screen.getByTestId('sleep-indicator')).toHaveTextContent('Sleep after this track');
  });

  it('cancels the timer when the ✕ is tapped', async () => {
    const armSleep = vi.fn();
    renderWithProviders(<SleepIndicator />, { player: stubPlayer({ sleepMode: 15, armSleep }) });
    await userEvent.click(screen.getByTestId('sleep-cancel'));
    expect(armSleep).toHaveBeenCalledWith(null);
  });
});
