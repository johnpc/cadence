import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const pushMock = vi.fn();
vi.mock('react-router-dom', () => ({ useHistory: () => ({ push: pushMock }) }));

let capturedHandler: ((e: { url: string }) => void) | null = null;
const removeMock = vi.fn();
vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn((_event: string, cb: (e: { url: string }) => void) => {
      capturedHandler = cb;
      return Promise.resolve({ remove: removeMock });
    }),
  },
}));

import { useWidgetDeepLink } from './useWidgetDeepLink';

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

  it('ignores a malformed deep link', () => {
    renderHook(() => useWidgetDeepLink());
    capturedHandler?.({ url: 'cadence://open?path=https://evil.com' });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('removes the listener on unmount', async () => {
    const { unmount } = renderHook(() => useWidgetDeepLink());
    unmount();
    await Promise.resolve();
    expect(removeMock).toHaveBeenCalled();
  });
});
