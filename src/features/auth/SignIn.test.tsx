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
    delete window.__CADENCE_CONFIG__;
  });

  it('shows no sign-up link by default (no runtime config)', () => {
    renderSignIn(vi.fn());
    expect(screen.queryByTestId('signin-signup')).not.toBeInTheDocument();
  });

  it('shows a Sign up link pointing at the runtime SIGNUP_URL when set', () => {
    window.__CADENCE_CONFIG__ = { signupUrl: 'https://s.jpc.io/getthejelly' };
    renderSignIn(vi.fn());
    const link = screen.getByTestId('signin-signup');
    expect(link).toHaveAttribute('href', 'https://s.jpc.io/getthejelly');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('submits the entered credentials', async () => {
    const signIn = vi.fn().mockResolvedValue(undefined);
    renderSignIn(signIn);
    // No build-time default server is committed, so the user must enter one —
    // fill it before submitting or the form blocks with "enter your server".
    await userEvent.type(screen.getByTestId('signin-server'), 'https://jf.example.com');
    await userEvent.type(screen.getByTestId('signin-username'), 'cadence-test');
    await userEvent.type(screen.getByTestId('signin-password'), 'pw');
    await userEvent.click(screen.getByTestId('signin-submit'));
    expect(signIn).toHaveBeenCalledWith('cadence-test', 'pw');
  });

  it('persists the entered server URL before authenticating', async () => {
    localStorage.removeItem('cadence.server-url');
    const signIn = vi.fn().mockResolvedValue(undefined);
    renderSignIn(signIn);
    const server = screen.getByTestId('signin-server');
    await userEvent.clear(server);
    await userEvent.type(server, 'https://my.jelly.example');
    await userEvent.type(screen.getByTestId('signin-username'), 'u');
    await userEvent.type(screen.getByTestId('signin-password'), 'p');
    await userEvent.click(screen.getByTestId('signin-submit'));
    expect(localStorage.getItem('cadence.server-url')).toBe('https://my.jelly.example');
  });

  it('submits when Enter is pressed in a field (native form submit)', async () => {
    const signIn = vi.fn().mockResolvedValue(undefined);
    renderSignIn(signIn);
    await userEvent.type(screen.getByTestId('signin-server'), 'https://jf.example.com');
    await userEvent.type(screen.getByTestId('signin-username'), 'cadence-test');
    // {enter} inside a form field triggers submit without touching the button.
    await userEvent.type(screen.getByTestId('signin-password'), 'pw{enter}');
    expect(signIn).toHaveBeenCalledWith('cadence-test', 'pw');
  });

  it('shows an error when sign-in fails', async () => {
    const signIn = vi.fn().mockRejectedValue(new Error('401'));
    renderSignIn(signIn);
    await userEvent.type(screen.getByTestId('signin-server'), 'https://jf.example.com');
    await userEvent.type(screen.getByTestId('signin-username'), 'x');
    await userEvent.type(screen.getByTestId('signin-password'), 'bad');
    await userEvent.click(screen.getByTestId('signin-submit'));
    await waitFor(() =>
      expect(screen.getByTestId('signin-error')).toHaveTextContent(
        'Check your server address, username, and password.',
      ),
    );
  });
});
