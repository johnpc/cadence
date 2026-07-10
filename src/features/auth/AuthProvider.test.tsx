import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./authClient', () => ({ signIn: vi.fn(), signOut: vi.fn() }));
vi.mock('./resolveSession', () => ({ resolveSession: vi.fn() }));
vi.mock('../../lib/deviceId', () => ({ ensureDeviceId: vi.fn().mockResolvedValue('dev') }));

import * as authClient from './authClient';
import { resolveSession } from './resolveSession';
import { notifySessionExpired } from '../../lib/sessionExpiry';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

function Probe() {
  const { status, username, signIn, signOut } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="username">{username ?? '-'}</span>
      <button onClick={() => void signIn('cadence-test', 'pw')}>in</button>
      <button onClick={() => void signOut()}>out</button>
    </div>
  );
}

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

describe('AuthProvider', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('resolves the initial session on mount', async () => {
    vi.mocked(resolveSession).mockResolvedValue({
      status: 'authenticated',
      username: 'cadence-test',
    });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('username')).toHaveTextContent('cadence-test');
  });

  it('signs in then refreshes to authenticated', async () => {
    vi.mocked(resolveSession)
      .mockResolvedValueOnce({ status: 'unauthenticated', username: null })
      .mockResolvedValueOnce({ status: 'authenticated', username: 'cadence-test' });
    vi.mocked(authClient.signIn).mockResolvedValue();
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    await userEvent.click(screen.getByText('in'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(authClient.signIn).toHaveBeenCalledWith('cadence-test', 'pw');
  });

  it('re-validates and signs out when the token expires mid-session (401)', async () => {
    // First resolve: authenticated. After a 401 fires notifySessionExpired, the
    // provider re-runs resolveSession, which now reports the dead token.
    vi.mocked(resolveSession)
      .mockResolvedValueOnce({ status: 'authenticated', username: 'cadence-test' })
      .mockResolvedValueOnce({ status: 'unauthenticated', username: null });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    notifySessionExpired();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
  });

  it('signs out to unauthenticated', async () => {
    vi.mocked(resolveSession).mockResolvedValue({
      status: 'authenticated',
      username: 'cadence-test',
    });
    vi.mocked(authClient.signOut).mockResolvedValue();
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    await userEvent.click(screen.getByText('out'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
  });
});
