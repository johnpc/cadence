import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDiagnosticsContext } from './useDiagnosticsContext';
import * as store from '../../lib/diagnostics/diagnosticsStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

vi.mock('../../lib/platform', () => ({ isIos: () => false }));

const track = (Id: string, Name: string): JellyfinItem =>
  ({ Id, Name, Artists: ['An Artist'], Album: 'An Album' }) as JellyfinItem;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useDiagnosticsContext', () => {
  it('sets track context + logs a track-change when a track is present', () => {
    const setCtx = vi.spyOn(store, 'setLogContext');
    const logSpy = vi.spyOn(store, 'log');
    renderHook(() => useDiagnosticsContext(track('t1', 'Song A')));
    expect(setCtx).toHaveBeenCalledWith(
      expect.objectContaining({ platform: 'web', trackId: 't1', title: 'Song A' }),
    );
    expect(logSpy).toHaveBeenCalledWith(
      'track-change',
      'now playing',
      expect.objectContaining({ title: 'Song A', album: 'An Album' }),
    );
  });

  it('sets platform-only context (no track-change) when there is no track', () => {
    const setCtx = vi.spyOn(store, 'setLogContext');
    const logSpy = vi.spyOn(store, 'log');
    renderHook(() => useDiagnosticsContext(null));
    expect(setCtx).toHaveBeenCalledWith({ platform: 'web' });
    expect(logSpy).not.toHaveBeenCalled();
  });
});
