import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, useHistory } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from './AuthContext';
import { useSignInForm } from './useSignInForm';
import type { AuthContextValue } from './types';

vi.mock('../../lib/serverUrlStore', () => ({
  getServerUrl: () => 'https://jf.test',
  setServerUrl: vi.fn(),
}));

// A tiny harness that drives the hook's submit() and shows the resulting path.
function Harness() {
  const { submit } = useSignInForm();
  const history = useHistory();
  return (
    <>
      <button data-testid="go" onClick={() => void submit()}>
        go
      </button>
      <button data-testid="tap-search" onClick={() => history.push('/search')}>
        search
      </button>
    </>
  );
}

function renderAt(path: string, signIn: AuthContextValue['signIn']) {
  const value: AuthContextValue = {
    status: 'unauthenticated',
    username: null,
    signIn,
    signOut: vi.fn(),
    refresh: vi.fn(),
  };
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthContext.Provider value={value}>
        <Harness />
        <Route
          path="*"
          render={({ location }) => <span data-testid="loc">{location.pathname}</span>}
        />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useSignInForm deep-link preservation', () => {
  it('returns to a shared deep link after sign-in (e.g. /album/123)', async () => {
    renderAt('/album/123', vi.fn().mockResolvedValue(undefined));
    await act(async () => {
      screen.getByTestId('go').click();
    });
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent('/album/123'));
  });

  it('goes to / (→ home) when opened at the app root', async () => {
    renderAt('/', vi.fn().mockResolvedValue(undefined));
    await act(async () => {
      screen.getByTestId('go').click();
    });
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent('/'));
  });

  it('does not yank the user back if they navigated while sign-in was finishing', async () => {
    // signIn resolves after a slow post-auth refresh; the shell is already up and
    // the user taps Search in that gap. The late redirect must not undo that.
    let finish: () => void = () => undefined;
    renderAt(
      '/',
      vi.fn(() => new Promise<void>((resolve) => (finish = resolve))),
    );
    await act(async () => {
      screen.getByTestId('go').click();
    });
    await act(async () => {
      screen.getByTestId('tap-search').click();
    });
    await act(async () => {
      finish();
    });
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent('/search'));
  });

  it('does not navigate when sign-in fails', async () => {
    renderAt('/album/123', vi.fn().mockRejectedValue(new Error('bad creds')));
    await act(async () => {
      screen.getByTestId('go').click();
    });
    // Stays on the attempted path (no replace happened) — still /album/123.
    await waitFor(() => expect(screen.getByTestId('loc')).toHaveTextContent('/album/123'));
  });
});
