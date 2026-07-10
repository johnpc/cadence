import { describe, expect, it, vi } from 'vitest';
import { addToPlaylistWithToast } from './addWithToast';

/** A stand-in for the react-query mutation whose mutate() invokes whichever
 * callback the outcome dictates, so we can assert the toast follows reality. */
function fakeAdd(outcome: 'success' | 'error') {
  return {
    mutate: vi.fn((_vars, opts) =>
      outcome === 'success' ? opts?.onSuccess?.() : opts?.onError?.(),
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe('addToPlaylistWithToast', () => {
  it('toasts success only after the add resolves', () => {
    const toast = vi.fn();
    const add = fakeAdd('success');
    addToPlaylistWithToast(add, toast, 'pl1', 't1', 'Chill');
    expect(add.mutate).toHaveBeenCalledWith(
      { playlistId: 'pl1', itemId: 't1' },
      expect.any(Object),
    );
    expect(toast).toHaveBeenCalledWith('Added to Chill');
  });

  it('toasts failure — never a false success — when the add errors', () => {
    const toast = vi.fn();
    addToPlaylistWithToast(fakeAdd('error'), toast, 'pl1', 't1', 'Chill');
    expect(toast).toHaveBeenCalledWith("Couldn't add to Chill");
    expect(toast).not.toHaveBeenCalledWith('Added to Chill');
  });
});
