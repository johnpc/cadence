import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const request = vi.fn();
vi.mock('./jellyfinFetch', () => ({ request: (path: string) => request(path) }));

import { hydratePluginConfig } from './pluginConfigStore';

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
    });
    await hydratePluginConfig();
    expect(window.__CADENCE_CONFIG__).toMatchObject({
      marlinUrl: 'https://marlin.example.com',
      signupUrl: 'https://signup.example.com',
      castReceiverAppId: 'ABC123',
      lidarrProxy: true,
      lidarrPluginProxy: true,
      deezerImport: true,
    });
    expect(request).toHaveBeenCalledWith('/Cadence/Config');
  });

  it('does NOT override values already set by the deploy (nginx config.js wins)', async () => {
    window.__CADENCE_CONFIG__ = { marlinUrl: 'https://deploy-marlin', lidarrProxy: true };
    request.mockResolvedValue({ MarlinUrl: 'https://plugin-marlin', LidarrProxy: true });
    await hydratePluginConfig();
    // Deploy marlin URL kept; lidarrProxy stays nginx (no plugin flag added).
    expect(window.__CADENCE_CONFIG__?.marlinUrl).toBe('https://deploy-marlin');
    expect(window.__CADENCE_CONFIG__?.lidarrPluginProxy).toBeUndefined();
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
    expect(window.__CADENCE_CONFIG__?.lidarrProxy).toBeUndefined();
    expect(window.__CADENCE_CONFIG__?.deezerImport).toBeUndefined();
  });

  it('swallows a fetch failure (no plugin / offline) and leaves config untouched', async () => {
    window.__CADENCE_CONFIG__ = { serverUrl: 'https://jf' };
    request.mockRejectedValue(new Error('404'));
    await hydratePluginConfig();
    expect(window.__CADENCE_CONFIG__).toEqual({ serverUrl: 'https://jf' });
  });

  it('creates the config object when absent', async () => {
    request.mockResolvedValue({ SignupUrl: 'https://s.example.com' });
    await hydratePluginConfig();
    expect(window.__CADENCE_CONFIG__?.signupUrl).toBe('https://s.example.com');
  });
});
