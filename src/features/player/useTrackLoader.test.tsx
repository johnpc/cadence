import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRef } from 'react';
import { useTrackLoader } from './useTrackLoader';

vi.mock('../../lib/jellyfinStream', () => ({
  audioStreamUrl: (id: string) => `https://jf.test/Audio/${id}/universal`,
}));
vi.mock('../downloads/downloadStore', () => ({ localAudioUrl: vi.fn(), isDownloaded: vi.fn() }));
vi.mock('../cast/castStore', () => ({ getCastState: vi.fn(() => ({ connected: false })) }));
vi.mock('../cast/castController', () => ({ castTrack: vi.fn().mockResolvedValue(undefined) }));
import { localAudioUrl, isDownloaded } from '../downloads/downloadStore';
import { getCastState } from '../cast/castStore';
import { castTrack } from '../cast/castController';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** A fake audio element exposing just what the loader touches. */
function fakeAudio() {
  return {
    src: '',
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
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

  it('streams from Jellyfin synchronously when the track is not downloaded', () => {
    vi.mocked(isDownloaded).mockReturnValue(false);
    const audio = fakeAudio();
    renderHook(() => useLoader(track('t1'), audio));
    // The common (streaming) path is synchronous — no waitFor needed.
    expect(audio.src).toBe('https://jf.test/Audio/t1/universal');
    expect(localAudioUrl).not.toHaveBeenCalled();
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

  it('does nothing without a current track', () => {
    const audio = fakeAudio();
    renderHook(() => useLoader(undefined, audio));
    expect(audio.src).toBe('');
    expect(isDownloaded).not.toHaveBeenCalled();
  });

  it('leaves a session-restored first track paused (no autoplay)', () => {
    vi.mocked(isDownloaded).mockReturnValue(false);
    const audio = fakeAudio();
    renderHook(() => useLoader(track('restored'), audio));
    expect(audio.src).not.toBe('');
    expect(audio.play).not.toHaveBeenCalled();
  });
});
