import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SpeedControl } from './SpeedControl';
import { rateLabel } from './rateLabel';

describe('rateLabel', () => {
  it('prints rates without trailing zeros or float noise', () => {
    expect(rateLabel(1)).toBe('1×');
    expect(rateLabel(1.5)).toBe('1.5×');
    expect(rateLabel(0.75)).toBe('0.75×');
    expect(rateLabel(1.2500000001)).toBe('1.25×');
  });
});

describe('SpeedControl', () => {
  it('opens and closes the preset strip from the pill, marking the current rate', async () => {
    const onRate = vi.fn();
    const onAct = vi.fn();
    render(<SpeedControl rate={1.25} onRate={onRate} onAct={onAct} testPrefix="readalong-" />);
    const pill = screen.getByTestId('readalong-speed');
    expect(pill).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(pill);
    expect(pill).toHaveAttribute('aria-expanded', 'true');
    const on = screen
      .getAllByTestId('readalong-speed-option')
      .filter((o) => o.getAttribute('aria-checked') === 'true');
    expect(on.map((o) => o.textContent)).toEqual(['1.25×']);
    await userEvent.click(pill);
    expect(screen.queryAllByTestId('readalong-speed-option')).toHaveLength(0);
    expect(onRate).not.toHaveBeenCalled();
    expect(onAct).not.toHaveBeenCalled();
  });
});

describe('SpeedControl choosing a preset', () => {
  it('sets the rate, closes the strip and hands the view back', async () => {
    const onRate = vi.fn();
    const onAct = vi.fn();
    render(
      <SpeedControl rate={1} onRate={onRate} onAct={onAct} testPrefix="full-player-" align="end" />,
    );
    await userEvent.click(screen.getByTestId('full-player-speed'));
    const option = screen
      .getAllByTestId('full-player-speed-option')
      .find((o) => o.textContent === '1.5×');
    await userEvent.click(option as HTMLElement);
    expect(onRate).toHaveBeenCalledWith(1.5);
    expect(onAct).toHaveBeenCalledTimes(1);
    expect(screen.queryAllByTestId('full-player-speed-option')).toHaveLength(0);
  });

  it('works without an onAct (the full player has nothing to re-follow)', async () => {
    const onRate = vi.fn();
    render(<SpeedControl rate={1} onRate={onRate} testPrefix="full-player-" />);
    await userEvent.click(screen.getByTestId('full-player-speed'));
    await userEvent.click(screen.getAllByTestId('full-player-speed-option')[0]);
    expect(onRate).toHaveBeenCalledWith(0.75);
  });
});
