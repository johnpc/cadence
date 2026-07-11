import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { sendLyrics } = vi.hoisted(() => ({ sendLyrics: vi.fn().mockResolvedValue(undefined) }));
vi.mock('./castBroadcast', () => ({ sendLyrics }));

const player = { current: { Id: 't1', Name: 'S' } as unknown };
vi.mock('../player/usePlayer', () => ({ usePlayer: () => player }));
const cast = { connected: false };
vi.mock('./useCast', () => ({ useCast: () => cast }));
const progress = { position: 0 };
vi.mock('../player/PlayerProgressContext', () => ({ usePlayerProgress: () => progress }));
const lyrics = { lines: [] as { text: string; start?: number }[] };
vi.mock('../player/useLyrics', () => ({ useLyrics: () => lyrics }));

import { useCastLyrics } from './useCastLyrics';

const LINES = [
  { text: 'one', start: 0 },
  { text: 'two', start: 5 },
];

describe('useCastLyrics', () => {
  afterEach(() => {
    vi.clearAllMocks();
    cast.connected = false;
    progress.position = 0;
    lyrics.lines = [];
  });

  it('does not broadcast when not connected', () => {
    lyrics.lines = LINES;
    renderHook(() => useCastLyrics());
    expect(sendLyrics).not.toHaveBeenCalled();
  });

  it('does not broadcast when the track has no lyrics', () => {
    cast.connected = true;
    lyrics.lines = [];
    renderHook(() => useCastLyrics());
    expect(sendLyrics).not.toHaveBeenCalled();
  });

  it('broadcasts lyrics with the active line while casting', () => {
    cast.connected = true;
    lyrics.lines = LINES;
    progress.position = 6; // past the second line's start
    renderHook(() => useCastLyrics());
    expect(sendLyrics).toHaveBeenCalledWith(LINES, 1);
  });

  it('re-broadcasts when the active line advances', () => {
    cast.connected = true;
    lyrics.lines = LINES;
    progress.position = 0;
    const { rerender } = renderHook(() => useCastLyrics());
    expect(sendLyrics).toHaveBeenLastCalledWith(LINES, 0);
    progress.position = 5; // second line now active
    rerender();
    expect(sendLyrics).toHaveBeenLastCalledWith(LINES, 1);
  });
});
