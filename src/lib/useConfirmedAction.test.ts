import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useConfirmedAction } from './useConfirmedAction';

function deferred() {
  let resolve!: () => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useConfirmedAction', () => {
  it('goes idle → confirming → running → idle', async () => {
    const d = deferred();
    const action = vi.fn(() => d.promise);
    const { result } = renderHook(() => useConfirmedAction(action));
    expect(result.current.phase).toBe('idle');
    act(() => result.current.ask());
    expect(result.current.phase).toBe('confirming');
    let run!: Promise<void>;
    act(() => {
      run = result.current.run();
    });
    // The alert's onDidDismiss fires after its confirm handler: must not reset.
    act(() => result.current.dismissed());
    expect(result.current.phase).toBe('running');
    await act(async () => {
      d.resolve();
      await run;
    });
    expect(result.current.phase).toBe('idle');
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('cancelling the confirm returns to idle without running', () => {
    const action = vi.fn(() => Promise.resolve());
    const { result } = renderHook(() => useConfirmedAction(action));
    act(() => result.current.ask());
    act(() => result.current.dismissed());
    expect(result.current.phase).toBe('idle');
    expect(action).not.toHaveBeenCalled();
  });

  it('ignores a second run and a re-ask while running', async () => {
    const d = deferred();
    const action = vi.fn(() => d.promise);
    const { result } = renderHook(() => useConfirmedAction(action));
    let first!: Promise<void>;
    act(() => {
      first = result.current.run();
    });
    await act(async () => {
      await result.current.run();
    });
    act(() => result.current.ask());
    expect(result.current.phase).toBe('running');
    await act(async () => {
      d.resolve();
      await first;
    });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('returns to idle when the action fails', async () => {
    const d = deferred();
    const { result } = renderHook(() => useConfirmedAction(() => d.promise));
    let run!: Promise<void>;
    act(() => {
      run = result.current.run();
    });
    await act(async () => {
      d.reject(new Error('boom'));
      await run.catch(() => undefined);
    });
    expect(result.current.phase).toBe('idle');
  });
});
