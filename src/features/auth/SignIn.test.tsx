import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from './AuthContext';
import { SignIn } from './SignIn';
import type { AuthContextValue } from './types';

function renderSignIn(signIn: AuthContextValue['signIn']) {
  const value: AuthContextValue = {
    status: 'unauthenticated',
    username: null,
    signIn,
    signOut: vi.fn(),
    refresh: vi.fn(),
  };
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={value}>
        <SignIn />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe('SignIn', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('submits the entered credentials', async () => {
    const signIn = vi.fn().mockResolvedValue(undefined);
    renderSignIn(signIn);
    await userEvent.type(screen.getByTestId('signin-username'), 'cadence-test');
    await userEvent.type(screen.getByTestId('signin-password'), 'pw');
    await userEvent.click(screen.getByTestId('signin-submit'));
    expect(signIn).toHaveBeenCalledWith('cadence-test', 'pw');
  });

  it('submits when Enter is pressed in a field (native form submit)', async () => {
    const signIn = vi.fn().mockResolvedValue(undefined);
    renderSignIn(signIn);
    await userEvent.type(screen.getByTestId('signin-username'), 'cadence-test');
    // {enter} inside a form field triggers submit without touching the button.
    await userEvent.type(screen.getByTestId('signin-password'), 'pw{enter}');
    expect(signIn).toHaveBeenCalledWith('cadence-test', 'pw');
  });

  it('shows an error when sign-in fails', async () => {
    const signIn = vi.fn().mockRejectedValue(new Error('401'));
    renderSignIn(signIn);
    await userEvent.type(screen.getByTestId('signin-username'), 'x');
    await userEvent.type(screen.getByTestId('signin-password'), 'bad');
    await userEvent.click(screen.getByTestId('signin-submit'));
    await waitFor(() =>
      expect(screen.getByTestId('signin-error')).toHaveTextContent(
        'Incorrect username or password.',
      ),
    );
  });
});
