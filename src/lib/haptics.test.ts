import { afterEach, describe, expect, it, vi } from 'vitest';

const impact = vi.fn().mockResolvedValue(undefined);
vi.mock('@capacitor/haptics', () => ({
  Haptics: { impact: (opts: unknown) => impact(opts) },
  ImpactStyle: { Light: 'LIGHT', Medium: 'MEDIUM', Heavy: 'HEAVY' },
}));

import { tap, ImpactStyle } from './haptics';

describe('haptics.tap', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fires a light impact by default', () => {
    tap();
    expect(impact).toHaveBeenCalledWith({ style: ImpactStyle.Light });
  });

  it('passes a custom style through', () => {
    tap(ImpactStyle.Heavy);
    expect(impact).toHaveBeenCalledWith({ style: ImpactStyle.Heavy });
  });

  it('swallows a rejected impact so the caller never breaks', async () => {
    impact.mockRejectedValueOnce(new Error('no plugin'));
    expect(() => tap()).not.toThrow();
    await Promise.resolve();
  });
});
