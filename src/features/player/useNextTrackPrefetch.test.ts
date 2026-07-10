import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinStream', () => ({ audioStreamUrl: (id: string) => `stream:${id}` }));
import { useNextTrackPrefetch } from './useNextTrackPrefetch';
import { startQueue } from './queue';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = (id: string): JellyfinItem => ({ Id: id, Name: id, Type: 'Audio' });
const queue = startQueue(['a', 'b', 'c'].map(track), 0);

// A stand-in <audio> capturing what the hook does to it (jsdom has no media).
class FakeAudio {
  src = '';
  preload = '';
  muted = false;
  load = vi.fn();
  removeAttribute = vi.fn(() => (this.src = ''));
}
let created: FakeAudio[] = [];

beforeEach(() => {
  created = [];
  vi.stubGlobal(
    'Audio',
    vi.fn(() => {
      const a = new FakeAudio();
      created.push(a);
      return a;
    }),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useNextTrackPrefetch', () => {
  it('buffers the next track while playing', () => {
    renderHook(() => useNextTrackPrefetch(queue, false, true));
    expect(created).toHaveLength(1);
    expect(created[0].src).toBe('stream:b');
    expect(created[0].preload).toBe('auto');
    expect(created[0].muted).toBe(true);
    expect(created[0].load).toHaveBeenCalled();
  });

  it('does nothing while paused', () => {
    renderHook(() => useNextTrackPrefetch(queue, false, false));
    expect(created).toHaveLength(0);
  });

  it('does nothing at the end of the queue without wrap', () => {
    renderHook(() => useNextTrackPrefetch(startQueue(['a'].map(track), 0), false, true));
    expect(created).toHaveLength(0);
  });

  it('releases the buffered request when the target changes', () => {
    const { rerender } = renderHook(
      ({ i }) => useNextTrackPrefetch(startQueue(['a', 'b', 'c'].map(track), i), false, true),
      {
        initialProps: { i: 0 },
      },
    );
    rerender({ i: 1 }); // next id goes b → c
    expect(created[0].removeAttribute).toHaveBeenCalledWith('src');
    expect(created[0].src).toBe('stream:c');
  });
});
