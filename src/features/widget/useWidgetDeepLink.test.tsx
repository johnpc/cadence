import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pushMock = vi.fn();
const location = { pathname: '/', search: '' };
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push: pushMock, location }) }));

let capturedHandler: ((e: { url: string }) => void) | null = null;
const removeMock = vi.fn();
const getLaunchUrl = vi.fn<[], Promise<{ url: string } | undefined>>();
vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn((_event: string, cb: (e: { url: string }) => void) => {
      capturedHandler = cb;
      return Promise.resolve({ remove: removeMock });
    }),
    getLaunchUrl: () => getLaunchUrl(),
  },
}));

import { useWidgetDeepLink } from './useWidgetDeepLink';

beforeEach(() => {
  getLaunchUrl.mockResolvedValue(undefined);
  location.pathname = '/';
  location.search = '';
});

afterEach(() => {
  vi.clearAllMocks();
  capturedHandler = null;
});

describe('useWidgetDeepLink', () => {
  it('routes to the parsed path on a widget open', () => {
    renderHook(() => useWidgetDeepLink());
    capturedHandler?.({ url: 'cadence://open?path=%2Faudiobooks' });
    expect(pushMock).toHaveBeenCalledWith('/audiobooks');
  });

  it('routes a universal link to the book page', () => {
    renderHook(() => useWidgetDeepLink());
    capturedHandler?.({ url: 'https://cadence.jpc.io/audiobook/hogfather-49614fe6' });
    expect(pushMock).toHaveBeenCalledWith('/audiobook/hogfather-49614fe6');
  });

  it('routes the cold-start launch URL once', async () => {
    getLaunchUrl.mockResolvedValue({ url: 'https://cadence.jpc.io/audiobook/circe-1234abcd' });
    renderHook(() => useWidgetDeepLink());
    await vi.waitFor(() => expect(pushMock).toHaveBeenCalledWith('/audiobook/circe-1234abcd'));
  });

  it('does not push the page the app is already on', () => {
    location.pathname = '/audiobook/circe-1234abcd';
    renderHook(() => useWidgetDeepLink());
    capturedHandler?.({ url: 'https://cadence.jpc.io/audiobook/circe-1234abcd' });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('survives a launch-URL read that fails', async () => {
    getLaunchUrl.mockRejectedValue(new Error('not native'));
    renderHook(() => useWidgetDeepLink());
    await Promise.resolve();
    capturedHandler?.({ url: 'cadence://open?path=%2Fhome' });
    expect(pushMock).toHaveBeenCalledWith('/home');
  });

  it('ignores a malformed deep link', () => {
    renderHook(() => useWidgetDeepLink());
    capturedHandler?.({ url: 'cadence://open?path=https://evil.com' });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('removes the listener on unmount and ignores a late launch URL', async () => {
    let resolveLaunch: (v: { url: string }) => void = () => undefined;
    getLaunchUrl.mockReturnValue(new Promise((r) => (resolveLaunch = r)));
    const { unmount } = renderHook(() => useWidgetDeepLink());
    unmount();
    resolveLaunch({ url: 'https://cadence.jpc.io/home' });
    await Promise.resolve();
    await Promise.resolve();
    expect(removeMock).toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
