import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  diagnosticsEnabled,
  setDiagnosticsEnabled,
  log,
  diagnosticsEntries,
  clearDiagnostics,
  onDiagnosticsChange,
  addDiagnosticsSink,
  setLogContext,
} from './diagnosticsStore';

beforeEach(() => {
  localStorage.clear();
  clearDiagnostics();
  setLogContext({});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('diagnosticsStore', () => {
  it('is disabled by default and log() is a no-op then', () => {
    expect(diagnosticsEnabled()).toBe(false);
    log('play', 'x');
    expect(diagnosticsEntries()).toHaveLength(0);
  });

  it('captures entries once enabled', () => {
    setDiagnosticsEnabled(true);
    log('play', 'started', { id: 't1' }, 1000);
    const entries = diagnosticsEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      ts: 1000,
      category: 'play',
      message: 'started',
      fields: { id: 't1' },
    });
  });

  it('bounds the ring buffer to 500 entries', () => {
    setDiagnosticsEnabled(true);
    for (let i = 0; i < 520; i++) log('e', String(i), {}, i);
    const entries = diagnosticsEntries();
    expect(entries).toHaveLength(500);
    // Oldest were dropped: first kept entry is #20.
    expect(entries[0].message).toBe('20');
  });

  it('clear empties the buffer', () => {
    setDiagnosticsEnabled(true);
    log('e', 'x');
    clearDiagnostics();
    expect(diagnosticsEntries()).toHaveLength(0);
  });

  it('notifies change listeners on log/clear/enable', () => {
    const cb = vi.fn();
    const off = onDiagnosticsChange(cb);
    setDiagnosticsEnabled(true);
    log('e', 'x');
    clearDiagnostics();
    expect(cb).toHaveBeenCalledTimes(3);
    off();
  });

  it('merges ambient context into every entry (per-event fields win)', () => {
    setDiagnosticsEnabled(true);
    setLogContext({ platform: 'ios', trackId: 't1', title: 'Song A' });
    log('play', 'started', {}, 1);
    log('pause', 'user', { trackId: 'override' }, 2);
    const [a, b] = diagnosticsEntries();
    expect(a.fields).toMatchObject({ platform: 'ios', trackId: 't1', title: 'Song A' });
    // Explicit per-event field overrides the ambient one.
    expect(b.fields.trackId).toBe('override');
    expect(b.fields.title).toBe('Song A');
  });

  it('feeds new entries to sinks, and a throwing sink never breaks logging', () => {
    setDiagnosticsEnabled(true);
    const good = vi.fn();
    addDiagnosticsSink(() => {
      throw new Error('boom');
    });
    addDiagnosticsSink(good);
    expect(() => log('e', 'x')).not.toThrow();
    expect(good).toHaveBeenCalledTimes(1);
  });
});
