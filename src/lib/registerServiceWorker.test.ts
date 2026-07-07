import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerServiceWorker } from './registerServiceWorker';

describe('registerServiceWorker', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // @ts-expect-error — clean up the stubbed serviceWorker between tests.
    delete navigator.serviceWorker;
  });

  it('no-ops when service workers are unsupported', () => {
    const addEventListener = vi.spyOn(window, 'addEventListener');
    registerServiceWorker();
    expect(addEventListener).not.toHaveBeenCalledWith('load', expect.anything(), expect.anything());
  });

  it('warns but does not throw when registration fails', async () => {
    const register = vi.fn().mockRejectedValue(new Error('nope'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register },
      configurable: true,
    });
    vi.spyOn(window, 'addEventListener').mockImplementation((_event, handler) => {
      (handler as () => void)();
    });

    registerServiceWorker();
    await vi.waitFor(() => expect(warn).toHaveBeenCalled());
  });

  it('registers /sw.js on window load when supported', () => {
    const register = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register },
      configurable: true,
    });
    const addEventListener = vi
      .spyOn(window, 'addEventListener')
      .mockImplementation((_event, handler) => {
        (handler as () => void)();
      });

    registerServiceWorker();

    expect(addEventListener).toHaveBeenCalledWith('load', expect.any(Function), { once: true });
    expect(register).toHaveBeenCalledWith('/sw.js');
  });
});
