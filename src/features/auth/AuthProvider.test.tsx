import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./authClient', () => ({ signIn: vi.fn(), signOut: vi.fn() }));
vi.mock('./resolveSession', () => ({ resolveSession: vi.fn() }));
vi.mock('../../lib/deviceId', () => ({ ensureDeviceId: vi.fn() }));
vi.mock('../../lib/queryClient', () => ({ queryClient: { clear: vi.fn() } }));
vi.mock('../player/queuePersistence', () => ({ clearPersistedQueue: vi.fn() }));

import * as authClient from './authClient';
import { resolveSession } from './resolveSession';
import { notifySessionExpired } from '../../lib/sessionExpiry';
import { queryClient } from '../../lib/queryClient';
import { clearPersistedQueue } from '../player/queuePersistence';
import { AuthProvider } from './AuthProvider';
import { ensureDeviceId } from '../../lib/deviceId';
import { RETRY_DELAYS_MS } from './sessionRetry';
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
  beforeEach(() => {
    vi.mocked(ensureDeviceId).mockResolvedValue('dev');
  });
  afterEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
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
    // The previous user's cached data + queue must not leak into the next session.
    expect(queryClient.clear).toHaveBeenCalled();
    expect(clearPersistedQueue).toHaveBeenCalled();
  });

  it('an unreadable session is "unavailable" and recovers on its own', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(resolveSession)
      .mockResolvedValueOnce({ status: 'unavailable', username: null })
      .mockResolvedValueOnce({ status: 'unavailable', username: null })
      .mockResolvedValue({ status: 'authenticated', username: 'cadence-test' });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unavailable'));
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0]); // still locked
    expect(screen.getByTestId('status')).toHaveTextContent('unavailable');
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[1]); // unlocked
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    const calls = vi.mocked(resolveSession).mock.calls.length;
    await vi.advanceTimersByTimeAsync(60_000); // retries stop once resolved
    expect(vi.mocked(resolveSession).mock.calls.length).toBe(calls);
  });

  it('retries at once when the app returns to the foreground', async () => {
    vi.mocked(resolveSession)
      .mockResolvedValueOnce({ status: 'unavailable', username: null })
      .mockResolvedValue({ status: 'authenticated', username: 'cadence-test' });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unavailable'));
    document.dispatchEvent(new Event('resume'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
  });

  it('a storage read that throws during launch is "unavailable", not a forever-splash', async () => {
    vi.mocked(ensureDeviceId).mockRejectedValueOnce(new Error('Preferences failed'));
    vi.mocked(resolveSession).mockResolvedValue({ status: 'authenticated', username: 'u' });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unavailable'));
    expect(screen.getByTestId('status')).not.toHaveTextContent('loading');
  });
});
