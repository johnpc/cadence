import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SleepTimer } from './SleepTimer';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';

describe('SleepTimer', () => {
  it('arms the timer for the chosen duration', async () => {
    const armSleep = vi.fn();
    renderWithProviders(<SleepTimer />, { player: stubPlayer({ armSleep }) });
    await userEvent.click(screen.getByTestId('sleep-30'));
    expect(armSleep).toHaveBeenCalledWith(30);
  });

  it('marks the active duration and cancels with Off', async () => {
    const armSleep = vi.fn();
    renderWithProviders(<SleepTimer />, { player: stubPlayer({ sleepMode: 60, armSleep }) });
    expect(screen.getByTestId('sleep-60')).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByTestId('sleep-off'));
    expect(armSleep).toHaveBeenCalledWith(null);
  });

  it('offers an "End of track" option that arms track mode', async () => {
    const armSleep = vi.fn();
    renderWithProviders(<SleepTimer />, { player: stubPlayer({ sleepMode: 'track', armSleep }) });
    expect(screen.getByTestId('sleep-track')).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByTestId('sleep-off'));
    expect(armSleep).toHaveBeenCalledWith(null);
  });
});
