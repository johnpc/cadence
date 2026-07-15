import { renderHook, waitFor, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRef } from 'react';
import { useTrackLoader } from './useTrackLoader';

vi.mock('../../lib/jellyfinStream', () => ({
  audioStreamUrl: (id: string) => `https://jf.test/Audio/${id}/universal`,
}));
vi.mock('../downloads/downloadStore', () => ({ localAudioUrl: vi.fn(), isDownloaded: vi.fn() }));
vi.mock('../cast/castStore', () => ({
  getCastState: vi.fn(() => ({ connected: false })),
  onCastStateChange: vi.fn(() => () => {}),
}));
vi.mock('../cast/castController', () => ({ castTrack: vi.fn().mockResolvedValue(undefined) }));
import { localAudioUrl, isDownloaded } from '../downloads/downloadStore';
import { getCastState } from '../cast/castStore';
import { castTrack } from '../cast/castController';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** A fake audio element exposing just what the loader touches. Captures canplay
 * listeners so a test can fire them (the loader retries play() on canplay). */
function fakeAudio() {
  const listeners: Record<string, Array<() => void>> = {};
  return {
    src: '',
    paused: true,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    addEventListener: vi.fn((evt: string, cb: () => void) => {
      (listeners[evt] ??= []).push(cb);
    }),
    removeEventListener: vi.fn((evt: string, cb: () => void) => {
      listeners[evt] = (listeners[evt] ?? []).filter((f) => f !== cb);
    }),
    /** Test helper: fire a captured event's listeners. */
    __emit: (evt: string) => (listeners[evt] ?? []).forEach((f) => f()),
  } as unknown as HTMLAudioElement;
}

const track = (Id: string): JellyfinItem => ({ Id, Name: Id }) as JellyfinItem;

/** Drive the hook with a ref pointing at our fake element. */
function useLoader(current: JellyfinItem | undefined, audio: HTMLAudioElement) {
  const ref = useRef<HTMLAudioElement | null>(audio);
  useTrackLoader(ref, current);
  return ref;
}

describe('useTrackLoader', () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.mocked(getCastState).mockReturnValue({ connected: false } as ReturnType<
      typeof getCastState
    >);
    vi.mocked(castTrack).mockResolvedValue(undefined);
  });

  it('streams from Jellyfin when the track is not downloaded', async () => {
    vi.mocked(isDownloaded).mockReturnValue(false);
    const audio = fakeAudio();
    renderHook(() => useLoader(track('t1'), audio));
    // src resolution runs through resolveTrackSrc (async) now.
    await waitFor(() => expect(audio.src).toBe('https://jf.test/Audio/t1/universal'));
  });

  it('plays from the local blob URL when the track is downloaded', async () => {
    vi.mocked(isDownloaded).mockReturnValue(true);
    vi.mocked(localAudioUrl).mockResolvedValue('blob:local/t1');
    const audio = fakeAudio();
    renderHook(() => useLoader(track('t1'), audio));
    await waitFor(() => expect(audio.src).toBe('blob:local/t1'));
  });

  it('falls back to the stream if a downloaded blob has gone missing', async () => {
    vi.mocked(isDownloaded).mockReturnValue(true);
    vi.mocked(localAudioUrl).mockResolvedValue(null);
    const audio = fakeAudio();
    renderHook(() => useLoader(track('t1'), audio));
    await waitFor(() => expect(audio.src).toBe('https://jf.test/Audio/t1/universal'));
  });

  it('casts to the TV (silencing local audio) when a cast session is connected', () => {
    vi.mocked(getCastState).mockReturnValue({ connected: true } as ReturnType<typeof getCastState>);
    const audio = fakeAudio();
    const t = track('t1');
    renderHook(() => useLoader(t, audio));
    expect(castTrack).toHaveBeenCalledWith(t);
    expect(audio.pause).toHaveBeenCalled();
    expect(audio.src).toBe(''); // local element never gets a src while casting
    expect(localAudioUrl).not.toHaveBeenCalled();
  });

  it('hands playback back to the phone (resumes) when casting ends', async () => {
    // Reactive cast mock: getCastState reads a mutable flag; onCastStateChange
    // registers a listener we fire to simulate SESSION_ENDED.
    let connected = true;
    let notify = () => {};
    vi.mocked(getCastState).mockImplementation(
      () => ({ connected }) as ReturnType<typeof getCastState>,
    );
    const { onCastStateChange } = await import('../cast/castStore');
    vi.mocked(onCastStateChange).mockImplementation((cb: () => void) => {
      notify = cb;
      return () => {};
    });
    vi.mocked(isDownloaded).mockReturnValue(false);
    const audio = fakeAudio();
    renderHook(() => useLoader(track('t1'), audio));
    // While casting: local element silent, track on the receiver.
    expect(castTrack).toHaveBeenCalled();
    expect(audio.src).toBe('');
    // Casting ends → the effect re-runs and resumes locally.
    connected = false;
    act(() => notify());
    await waitFor(() => expect(audio.src).toBe('https://jf.test/Audio/t1/universal'));
    expect(audio.play).toHaveBeenCalled();
  });

  it('does nothing without a current track', () => {
    const audio = fakeAudio();
    renderHook(() => useLoader(undefined, audio));
    expect(audio.src).toBe('');
    expect(isDownloaded).not.toHaveBeenCalled();
  });

  it('leaves a session-restored first track paused (no autoplay)', async () => {
    vi.mocked(isDownloaded).mockReturnValue(false);
    const audio = fakeAudio();
    renderHook(() => useLoader(track('restored'), audio));
    await waitFor(() => expect(audio.src).not.toBe(''));
    expect(audio.play).not.toHaveBeenCalled();
  });
});
