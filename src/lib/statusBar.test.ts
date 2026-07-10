import { afterEach, describe, expect, it, vi } from 'vitest';

const isNativePlatform = vi.fn(() => true);
const setStyle = vi.fn().mockResolvedValue(undefined);
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => isNativePlatform() } }));
vi.mock('@capacitor/status-bar', () => ({
  StatusBar: { setStyle: (o: unknown) => setStyle(o) },
  Style: { Dark: 'DARK', Light: 'LIGHT' },
}));

import { syncStatusBar } from './statusBar';

describe('syncStatusBar', () => {
  afterEach(() => {
    vi.clearAllMocks();
    isNativePlatform.mockReturnValue(true);
  });

  it('sets light status-bar content (Style.Dark) for the dark palette on native', () => {
    syncStatusBar('dark');
    expect(setStyle).toHaveBeenCalledWith({ style: 'DARK' });
  });

  it('sets dark status-bar content (Style.Light) for the light palette on native', () => {
    syncStatusBar('light');
    expect(setStyle).toHaveBeenCalledWith({ style: 'LIGHT' });
  });

  it('is a no-op on web (no native status bar)', () => {
    isNativePlatform.mockReturnValue(false);
    syncStatusBar('dark');
    expect(setStyle).not.toHaveBeenCalled();
  });

  it('swallows a rejected setStyle so theming never breaks', () => {
    setStyle.mockRejectedValueOnce(new Error('no plugin'));
    expect(() => syncStatusBar('dark')).not.toThrow();
  });
});
