import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { useAudiobookResume } from './useAudiobookResume';
import { setPendingSeek, takePendingSeek } from '../player/pendingSeek';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const S = 10_000_000;

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

describe('useAudiobookResume', () => {
  it('seeks to the saved position when metadata is already available', () => {
    const audio = fakeAudio(1);
    run(book(3600 * S), audio);
    expect(audio.currentTime).toBe(3600);
  });

  it('waits for loadedmetadata when readyState is 0', () => {
    const audio = fakeAudio(0) as HTMLAudioElement & { __fire: (e: string) => void };
    run(book(1800 * S), audio);
    expect(audio.currentTime).toBe(0);
    audio.__fire('loadedmetadata');
    expect(audio.currentTime).toBe(1800);
  });

  it('does not seek for a music track', () => {
    const audio = fakeAudio(1);
    const song = {
      Id: 's',
      Name: 'S',
      Type: 'Audio',
      UserData: { PlaybackPositionTicks: 3600 * S },
    };
    run(song as JellyfinItem, audio);
    expect(audio.currentTime).toBe(0);
  });

  it('does not yank a listener who already scrubbed', () => {
    const audio = fakeAudio(1);
    audio.currentTime = 500; // already moved past the 1s guard
    run(book(3600 * S), audio);
    expect(audio.currentTime).toBe(500);
  });

  it('does nothing without a saved position', () => {
    const audio = fakeAudio(1);
    run(book(0), audio);
    expect(audio.currentTime).toBe(0);
  });

  it('honours a pending chapter seek over the saved position', () => {
    const audio = fakeAudio(1);
    setPendingSeek('b', 900);
    run(book(3600 * S), audio);
    expect(audio.currentTime).toBe(900);
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
