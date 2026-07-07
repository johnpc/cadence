import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const theme = vi.hoisted(() => ({
  preference: 'dark' as string,
  effective: 'dark' as string,
  setPreference: vi.fn(),
}));
vi.mock('./useTheme', () => ({ useTheme: () => theme }));

import { Appearance } from './Appearance';

describe('Appearance', () => {
  beforeEach(() => {
    theme.preference = 'dark';
    theme.setPreference = vi.fn();
  });

  it('renders the three options with the current preference pressed', () => {
    render(<Appearance />);
    expect(screen.getByRole('button', { name: 'System' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('sets the chosen preference on tap', () => {
    render(<Appearance />);
    fireEvent.click(screen.getByRole('button', { name: 'Light' }));
    expect(theme.setPreference).toHaveBeenCalledWith('light');
  });
});
