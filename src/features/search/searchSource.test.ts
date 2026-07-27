import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Control the marlin config from tests (the selector reads these).
const marlin = { configured: false };
vi.mock('../../lib/marlinStore', () => ({
  marlinConfigured: () => marlin.configured,
}));
vi.mock('../../lib/navidromeSearch', () => ({ navidromeSearchSource: vi.fn() }));
vi.mock('./marlinSource', () => ({ marlinSearchSource: vi.fn() }));

import { searchSource } from './searchSource';
import { navidromeSearchSource } from '../../lib/navidromeSearch';
import { marlinSearchSource } from './marlinSource';

beforeEach(() => {
  marlin.configured = false;
  vi.mocked(navidromeSearchSource).mockResolvedValue([{ Id: 'native', Name: 'N', Type: 'Audio' }]);
});

describe('searchSource (active selector)', () => {
  afterEach(() => {
    vi.clearAllMocks();
    delete window.__CADENCE_CONFIG__;
  });

  it('uses native search when marlin is not configured (default)', async () => {
    const results = await searchSource('x', 10);
    expect(marlinSearchSource).not.toHaveBeenCalled();
    expect(results).toEqual([{ Id: 'native', Name: 'N', Type: 'Audio' }]);
  });

  it('activates marlin via the same-origin proxy even without a Settings URL', async () => {
    marlin.configured = false; // no user Settings URL…
    window.__CADENCE_CONFIG__ = { marlinProxy: true }; // …but the deploy enabled the proxy
    vi.mocked(marlinSearchSource).mockResolvedValue([{ Id: 'marlin', Name: 'M', Type: 'Audio' }]);
    const results = await searchSource('x', 10);
    expect(marlinSearchSource).toHaveBeenCalledWith('x', 10);
    expect(navidromeSearchSource).not.toHaveBeenCalled();
    expect(results).toEqual([{ Id: 'marlin', Name: 'M', Type: 'Audio' }]);
  });

  it('activates marlin when the user configured a Settings URL', async () => {
    marlin.configured = true;
    vi.mocked(marlinSearchSource).mockResolvedValue([{ Id: 'marlin', Name: 'M', Type: 'Audio' }]);
    await searchSource('x', 10);
    expect(marlinSearchSource).toHaveBeenCalled();
  });

  it('falls back to native search when the configured marlin call fails', async () => {
    marlin.configured = true;
    vi.mocked(marlinSearchSource).mockRejectedValue(new Error('502'));
    const results = await searchSource('x', 10);
    expect(navidromeSearchSource).toHaveBeenCalled();
    expect(results).toEqual([{ Id: 'native', Name: 'N', Type: 'Audio' }]);
  });

  it('falls back to native search when the marlin fetch aborts (hung indexer)', async () => {
    marlin.configured = true;
    vi.mocked(marlinSearchSource).mockRejectedValue(new DOMException('aborted', 'AbortError'));
    const results = await searchSource('x', 10);
    expect(navidromeSearchSource).toHaveBeenCalled();
    expect(results).toEqual([{ Id: 'native', Name: 'N', Type: 'Audio' }]);
  });
});
