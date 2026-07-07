import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../auth/AuthContext';
import { ThemeProvider } from '../theme/ThemeProvider';
import { Settings } from './Settings';
import type { AuthContextValue } from '../auth/types';

function renderSettings(signOut = vi.fn()) {
  const value: AuthContextValue = {
    status: 'authenticated',
    username: 'cadence-test',
    signIn: vi.fn(),
    signOut,
    refresh: vi.fn(),
  };
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <AuthContext.Provider value={value}>
          <Settings />
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe('Settings', () => {
  it('shows the signed-in username', () => {
    renderSettings();
    expect(screen.getByTestId('settings-username')).toHaveTextContent('Signed in as cadence-test');
  });

  it('signs out when tapped', async () => {
    const signOut = vi.fn();
    renderSettings(signOut);
    await userEvent.click(screen.getByTestId('settings-signout'));
    expect(signOut).toHaveBeenCalledOnce();
  });
});
