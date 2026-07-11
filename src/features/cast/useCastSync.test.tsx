import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { sendNowPlaying, sendQueue } = vi.hoisted(() => ({
  sendNowPlaying: vi.fn().mockResolvedValue(undefined),
  sendQueue: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('./castBroadcast', () => ({ sendNowPlaying, sendQueue }));

const player = {
  current: null as unknown,
  isPlaying: false,
  queue: [] as unknown[],
  queueIndex: 0,
};
vi.mock('../player/usePlayer', () => ({ usePlayer: () => player }));
const cast = { connected: false };
vi.mock('./useCast', () => ({ useCast: () => cast }));

import { useCastSync } from './useCastSync';

const track = { Id: 't1', Name: 'Song' };

describe('useCastSync', () => {
  afterEach(() => {
    vi.clearAllMocks();
    cast.connected = false;
    player.current = null;
    player.queue = [];
  });

  it('does not broadcast when not connected', () => {
    player.current = track;
    renderHook(() => useCastSync());
    expect(sendNowPlaying).not.toHaveBeenCalled();
    expect(sendQueue).not.toHaveBeenCalled();
  });

  it('broadcasts now-playing + queue when connected', () => {
    cast.connected = true;
    player.current = track;
    player.queue = [track];
    renderHook(() => useCastSync());
    expect(sendNowPlaying).toHaveBeenCalledWith(track, false);
    expect(sendQueue).toHaveBeenCalledWith([track], 0);
  });

  it('re-broadcasts now-playing when the play state changes', () => {
    cast.connected = true;
    player.current = track;
    const { rerender } = renderHook(() => useCastSync());
    expect(sendNowPlaying).toHaveBeenCalledTimes(1);
    player.isPlaying = true;
    rerender();
    expect(sendNowPlaying).toHaveBeenCalledTimes(2);
    player.isPlaying = false;
  });
});
