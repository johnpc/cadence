import { afterEach, describe, expect, it, vi } from 'vitest';
import { isIos, hasSoftwareVolume } from './platform';

function stubUA(userAgent: string, maxTouchPoints = 0) {
  vi.stubGlobal('navigator', { userAgent, maxTouchPoints });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isIos', () => {
  it('is true for iPhone', () => {
    stubUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    expect(isIos()).toBe(true);
  });

  it('is true for iPadOS 13+ posing as Macintosh with touch', () => {
    stubUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', 5);
    expect(isIos()).toBe(true);
  });

  it('is false for a real Mac (no touch)', () => {
    stubUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', 0);
    expect(isIos()).toBe(false);
  });

  it('is false for Android/desktop Chrome', () => {
    stubUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120');
    expect(isIos()).toBe(false);
  });
});

describe('hasSoftwareVolume', () => {
  it('is false on iOS (volume is read-only there)', () => {
    stubUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');
    expect(hasSoftwareVolume()).toBe(false);
  });

  it('is true on desktop', () => {
    stubUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    expect(hasSoftwareVolume()).toBe(true);
  });
});
