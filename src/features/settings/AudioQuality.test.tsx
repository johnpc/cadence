import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { AudioQuality } from './AudioQuality';
import { readAudioQuality } from './audioQualityStore';

describe('AudioQuality setting', () => {
  afterEach(() => localStorage.clear());

  it('marks Automatic active by default', () => {
    render(<AudioQuality />);
    expect(screen.getByTestId('quality-auto')).toHaveAttribute('aria-pressed', 'true');
  });

  it('persists the chosen tier', async () => {
    render(<AudioQuality />);
    await userEvent.click(screen.getByTestId('quality-low'));
    expect(readAudioQuality()).toBe('low');
    expect(screen.getByTestId('quality-low')).toHaveAttribute('aria-pressed', 'true');
  });
});
