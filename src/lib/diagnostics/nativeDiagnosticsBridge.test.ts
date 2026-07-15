import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initNativeDiagnosticsBridge } from './nativeDiagnosticsBridge';
import { log } from './diagnosticsStore';

vi.mock('./diagnosticsStore', () => ({ log: vi.fn() }));

interface BridgeWindow {
  __cadenceNativeLog?: (c: string, m: string, f?: string) => void;
}

beforeEach(() => {
  initNativeDiagnosticsBridge();
});

afterEach(() => {
  delete (window as unknown as BridgeWindow).__cadenceNativeLog;
  vi.clearAllMocks();
});

describe('initNativeDiagnosticsBridge', () => {
  it('installs a global that logs with source=ios', () => {
    (window as unknown as BridgeWindow).__cadenceNativeLog?.('native-session', 'reasserted');
    expect(log).toHaveBeenCalledWith('native-session', 'reasserted', { source: 'ios' });
  });

  it('merges parsed JSON fields and forces source=ios', () => {
    (window as unknown as BridgeWindow).__cadenceNativeLog?.(
      'interruption',
      'ended',
      '{"reason":"siri","source":"spoofed"}',
    );
    expect(log).toHaveBeenCalledWith('interruption', 'ended', { reason: 'siri', source: 'ios' });
  });

  it('tolerates malformed fields json (source-only)', () => {
    (window as unknown as BridgeWindow).__cadenceNativeLog?.('x', 'y', 'not json');
    expect(log).toHaveBeenCalledWith('x', 'y', { source: 'ios' });
  });
});
