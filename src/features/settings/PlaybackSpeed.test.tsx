import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PlaybackSpeed } from './PlaybackSpeed';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';

describe('PlaybackSpeed', () => {
  it('marks the active rate and labels 1× as Normal', () => {
    renderWithProviders(<PlaybackSpeed />, { player: stubPlayer({ rate: 1 }) });
    expect(screen.getByTestId('speed-1')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('speed-1')).toHaveTextContent('Normal');
    expect(screen.getByTestId('speed-1.5')).toHaveTextContent('1.5×');
  });

  it('sets a new rate when tapped', async () => {
    const setRate = vi.fn();
    renderWithProviders(<PlaybackSpeed />, { player: stubPlayer({ rate: 1, setRate }) });
    await userEvent.click(screen.getByTestId('speed-1.5'));
    expect(setRate).toHaveBeenCalledWith(1.5);
  });
});
