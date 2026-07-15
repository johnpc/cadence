import { afterEach, describe, expect, it, vi } from 'vitest';

const { isNativePlatform } = vi.hoisted(() => ({ isNativePlatform: vi.fn() }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform } }));

import { registerServiceWorker } from './registerServiceWorker';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('registerServiceWorker', () => {
  it('does NOT register on the native platform', () => {
    isNativePlatform.mockReturnValue(true);
    const register = vi.fn();
    vi.stubGlobal('navigator', { serviceWorker: { register } });
    const addEventListener = vi.fn();
    vi.stubGlobal('window', { addEventListener });

    registerServiceWorker();

    expect(addEventListener).not.toHaveBeenCalled();
    expect(register).not.toHaveBeenCalled();
  });

  it('registers sw.js on load on the web', () => {
    isNativePlatform.mockReturnValue(false);
    const register = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { serviceWorker: { register } });
    let loadHandler: (() => void) | undefined;
    vi.stubGlobal('window', {
      addEventListener: (evt: string, cb: () => void) => {
        if (evt === 'load') loadHandler = cb;
      },
    });

    registerServiceWorker();
    loadHandler?.();

    expect(register).toHaveBeenCalledWith('/sw.js');
  });

  it('is a no-op when the browser has no service worker support', () => {
    isNativePlatform.mockReturnValue(false);
    const addEventListener = vi.fn();
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('window', { addEventListener });

    registerServiceWorker();

    expect(addEventListener).not.toHaveBeenCalled();
  });
});
