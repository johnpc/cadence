import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const request = vi.fn();
vi.mock('./jellyfinFetch', () => ({ request: (path: string) => request(path) }));

import { hydratePluginConfig, isPluginConfigHydrated } from './pluginConfigStore';

beforeEach(() => {
  request.mockReset();
  delete window.__CADENCE_CONFIG__;
});

afterEach(() => {
  delete window.__CADENCE_CONFIG__;
});

describe('hydratePluginConfig', () => {
  it('merges the plugin config into window.__CADENCE_CONFIG__', async () => {
    request.mockResolvedValue({
      MarlinUrl: 'https://marlin.example.com',
      SignupUrl: 'https://signup.example.com',
      CastReceiverAppId: 'ABC123',
      LidarrProxy: true,
      DeezerImport: true,
      // An OLDER plugin still advertising the retired fast paths: ignored.
      HomeShelves: true,
      Audiobooks: true,
    });
    await hydratePluginConfig();
    expect(window.__CADENCE_CONFIG__).toMatchObject({
      marlinUrl: 'https://marlin.example.com',
      signupUrl: 'https://signup.example.com',
      castReceiverAppId: 'ABC123',
      lidarrProxy: true,
      deezerImport: true,
    });
    const raw = window.__CADENCE_CONFIG__ as Record<string, unknown>;
    expect(raw.homeShelves).toBeUndefined();
    expect(raw.audiobooks).toBeUndefined();
    expect(request).toHaveBeenCalledWith('/Cadence/Config');
  });

  it('does NOT override a deploy-set marlin URL (nginx config.js wins)', async () => {
    window.__CADENCE_CONFIG__ = { marlinUrl: 'https://deploy-marlin' };
    request.mockResolvedValue({ MarlinUrl: 'https://plugin-marlin', LidarrProxy: true });
    await hydratePluginConfig();
    expect(window.__CADENCE_CONFIG__?.marlinUrl).toBe('https://deploy-marlin');
    expect(window.__CADENCE_CONFIG__?.lidarrProxy).toBe(true);
  });

  it("the plugin alone decides Lidarr: an old container's lidarrProxy is overridden", async () => {
    // Pre-change images wrote lidarrProxy:true into config.js for their (now
    // removed, unauthenticated) nginx proxy — the plugin must decide instead.
    window.__CADENCE_CONFIG__ = { lidarrProxy: true };
    request.mockResolvedValue({ LidarrProxy: false });
    await hydratePluginConfig();
    expect(window.__CADENCE_CONFIG__?.lidarrProxy).toBe(false);
  });

  it('ignores empty strings and a false LidarrProxy / DeezerImport', async () => {
    request.mockResolvedValue({
      MarlinUrl: '  ',
      SignupUrl: '',
      LidarrProxy: false,
      DeezerImport: false,
    });
    await hydratePluginConfig();
    expect(window.__CADENCE_CONFIG__?.marlinUrl).toBeUndefined();
    expect(window.__CADENCE_CONFIG__?.signupUrl).toBeUndefined();
    expect(window.__CADENCE_CONFIG__?.lidarrProxy).toBe(false);
    expect(window.__CADENCE_CONFIG__?.deezerImport).toBeUndefined();
  });

  it('swallows a fetch failure (no plugin / offline) and leaves config untouched', async () => {
    window.__CADENCE_CONFIG__ = { serverUrl: 'https://jf' };
    request.mockRejectedValue(new Error('404'));
    await hydratePluginConfig();
    expect(window.__CADENCE_CONFIG__).toEqual({ serverUrl: 'https://jf' });
  });

  it('marks config hydrated once the fetch settles (so consumers stop waiting)', async () => {
    request.mockResolvedValue({});
    await hydratePluginConfig();
    // Signals to useHomeSource that plugin flags are final — even a failure counts,
    // which is why the flag is set in a finally, not only on success.
    expect(isPluginConfigHydrated()).toBe(true);
  });

  it('creates the config object when absent', async () => {
    request.mockResolvedValue({ SignupUrl: 'https://s.example.com' });
    await hydratePluginConfig();
    expect(window.__CADENCE_CONFIG__?.signupUrl).toBe('https://s.example.com');
  });
});
