import { renderHook, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// The live position comes from the server (getItem); mock it so the hook's
// resumeSeconds rules run against a fresh UserData we control per test.
vi.mock('../../lib/jellyfinItems', () => ({ getItem: vi.fn() }));
import { getItem } from '../../lib/jellyfinItems';
import { useAudiobookResume } from './useAudiobookResume';
import { setPendingSeek, takePendingSeek } from '../player/pendingSeek';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const S = 10_000_000;
const mockGetItem = vi.mocked(getItem);

/** A fake audio element exposing what the hook touches + a way to fire events. */
function fakeAudio(readyState = 1, duration = 36000) {
  const listeners: Record<string, Array<() => void>> = {};
  return {
    readyState,
    duration,
    currentTime: 0,
    addEventListener: (e: string, cb: () => void) => void (listeners[e] ??= []).push(cb),
    removeEventListener: (e: string, cb: () => void) => {
      listeners[e] = (listeners[e] ?? []).filter((f) => f !== cb);
    },
    __fire: (e: string) => (listeners[e] ?? []).forEach((f) => f()),
  } as unknown as HTMLAudioElement & { __fire: (e: string) => void };
}

function run(item: JellyfinItem | null, audio: HTMLAudioElement) {
  return renderHook(() => {
    const ref = useRef<HTMLAudioElement | null>(audio);
    useAudiobookResume(ref, item);
  });
}

const book = (ticks: number): JellyfinItem =>
  ({
    Id: 'b',
    Name: 'Book',
    Type: 'AudioBook',
    UserData: { PlaybackPositionTicks: ticks },
  }) as JellyfinItem;

/** Resolve getItem with the given saved position (the LIVE server value). */
const serverAt = (ticks: number) =>
  mockGetItem.mockResolvedValue({
    Id: 'b',
    Name: 'Book',
    Type: 'AudioBook',
    UserData: { PlaybackPositionTicks: ticks },
  } as JellyfinItem);

describe('useAudiobookResume', () => {
  beforeEach(() => {
    mockGetItem.mockReset();
  });

  it('seeks to the LIVE server position, ignoring the stale snapshot', async () => {
    const audio = fakeAudio(1);
    serverAt(3600 * S); // server knows 1h in, even though the snapshot says 0
    run(book(0), audio);
    await waitFor(() => expect(audio.currentTime).toBe(3600));
    expect(mockGetItem).toHaveBeenCalledWith('b');
  });

  it('waits for loadedmetadata when readyState is 0', async () => {
    const audio = fakeAudio(0) as HTMLAudioElement & { __fire: (e: string) => void };
    serverAt(1800 * S);
    run(book(0), audio);
    expect(audio.currentTime).toBe(0);
    audio.__fire('loadedmetadata');
    await waitFor(() => expect(audio.currentTime).toBe(1800));
  });

  it('does not seek for a music track', async () => {
    const audio = fakeAudio(1);
    const song = {
      Id: 's',
      Name: 'S',
      Type: 'Audio',
      UserData: { PlaybackPositionTicks: 3600 * S },
    };
    run(song as JellyfinItem, audio);
    await Promise.resolve();
    expect(audio.currentTime).toBe(0);
    expect(mockGetItem).not.toHaveBeenCalled();
  });

  it('does not yank a listener who already scrubbed', async () => {
    const audio = fakeAudio(1);
    audio.currentTime = 500; // already moved past the 1s guard
    serverAt(3600 * S);
    run(book(0), audio);
    await waitFor(() => expect(mockGetItem).toHaveBeenCalled());
    expect(audio.currentTime).toBe(500);
  });

  it('does nothing without a saved position', async () => {
    const audio = fakeAudio(1);
    serverAt(0);
    run(book(0), audio);
    await waitFor(() => expect(mockGetItem).toHaveBeenCalled());
    expect(audio.currentTime).toBe(0);
  });

  it('falls back to the snapshot position when the live read fails', async () => {
    const audio = fakeAudio(1);
    mockGetItem.mockRejectedValueOnce(new Error('offline'));
    run(book(3600 * S), audio); // snapshot carries the position
    await waitFor(() => expect(audio.currentTime).toBe(3600));
  });

  it('honours a pending chapter seek over the saved position (no server read)', () => {
    const audio = fakeAudio(1);
    setPendingSeek('b', 900);
    run(book(3600 * S), audio);
    expect(audio.currentTime).toBe(900);
    expect(mockGetItem).not.toHaveBeenCalled();
  });

  it('applies a pending chapter seek even when playback already moved', () => {
    const audio = fakeAudio(1);
    audio.currentTime = 500; // past the 1s resume guard
    setPendingSeek('b', 1200);
    run(book(0), audio);
    expect(audio.currentTime).toBe(1200);
    // consumed
    expect(takePendingSeek('b')).toBeNull();
  });
});
