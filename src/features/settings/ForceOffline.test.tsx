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

import { ForceOffline } from './ForceOffline';
import { readForceOffline } from './forceOfflineStore';

describe('ForceOffline setting', () => {
  afterEach(() => localStorage.clear());

  it('defaults off and persists a toggle', () => {
    render(<ForceOffline />);
    const toggle = screen.getByTestId('force-offline-toggle') as HTMLInputElement;
    expect(toggle.checked).toBe(false);
    fireEvent.click(toggle);
    expect(readForceOffline()).toBe(true);
    expect(toggle.checked).toBe(true);
  });
});
