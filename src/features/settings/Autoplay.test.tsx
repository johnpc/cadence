import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Render IonToggle as a real checkbox so jsdom can flip it and fire onIonChange.
vi.mock('@ionic/react', () => ({
  IonToggle: ({
    checked,
    onIonChange,
    ...rest
  }: {
    checked: boolean;
    onIonChange: (e: { detail: { checked: boolean } }) => void;
    'data-testid'?: string;
    'aria-label'?: string;
  }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onIonChange({ detail: { checked: e.target.checked } })}
      data-testid={rest['data-testid']}
      aria-label={rest['aria-label']}
    />
  ),
}));

import { Autoplay } from './Autoplay';
import { readAutoplay } from './autoplayStore';

describe('Autoplay setting', () => {
  afterEach(() => localStorage.clear());

  it('reflects the stored preference and persists a toggle', () => {
    render(<Autoplay />);
    const toggle = screen.getByTestId('autoplay-toggle') as HTMLInputElement;
    expect(toggle.checked).toBe(true); // default on
    fireEvent.click(toggle);
    expect(readAutoplay()).toBe(false);
    expect(toggle.checked).toBe(false);
  });
});
