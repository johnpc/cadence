import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../auth/AuthContext';
import { ThemeProvider } from '../theme/ThemeProvider';
import { Settings } from './Settings';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { AuthContextValue } from '../auth/types';

// Render IonAlert's buttons inline so the confirm step is clickable in jsdom.
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonAlert: ({
      isOpen,
      buttons,
    }: {
      isOpen: boolean;
      buttons: { text: string; handler?: () => void }[];
    }) =>
      isOpen ? (
        <div>
          {buttons.map((b) => (
            <button key={b.text} onClick={b.handler}>
              {b.text}
            </button>
          ))}
        </div>
      ) : null,
  };
});

function renderSettings(signOut = vi.fn()) {
  const value: AuthContextValue = {
    status: 'authenticated',
    username: 'cadence-test',
    signIn: vi.fn(),
    signOut,
    refresh: vi.fn(),
  };
  return renderWithProviders(
    <ThemeProvider>
      <AuthContext.Provider value={value}>
        <Settings />
      </AuthContext.Provider>
    </ThemeProvider>,
  );
}

describe('Settings', () => {
  it('shows the signed-in username', () => {
    renderSettings();
    expect(screen.getByTestId('settings-username')).toHaveTextContent('Signed in as cadence-test');
  });

  it('shows the app version', () => {
    renderSettings();
    expect(screen.getByTestId('settings-version')).toHaveTextContent(/^Cadence v\d/);
  });

  it('confirms before signing out', async () => {
    const signOut = vi.fn();
    renderSettings(signOut);
    await userEvent.click(screen.getByTestId('settings-signout'));
    // The tap opens a confirm; sign-out only fires after confirming.
    expect(signOut).not.toHaveBeenCalled();
    // Two "Sign out" buttons now exist (the trigger + the alert's confirm);
    // the confirm is the one rendered by the mocked alert (the last).
    const confirm = screen.getAllByRole('button', { name: 'Sign out' }).at(-1)!;
    await userEvent.click(confirm);
    expect(signOut).toHaveBeenCalledOnce();
  });
});
