import { afterEach, describe, expect, it, vi } from 'vitest';
import { startPlayback, resolveTrackSrc } from './startPlayback';
import { FakeAudio } from '../../test/fakeAudio';

const log = vi.fn();
vi.mock('../../lib/jellyfinStream', () => ({
  audioStreamUrl: (id: string) => `https://jf.test/Audio/${id}/universal`,
}));
vi.mock('../downloads/downloadStore', () => ({ localAudioUrl: vi.fn(), isDownloaded: vi.fn() }));
import { localAudioUrl, isDownloaded } from '../downloads/downloadStore';

function fakeAudio() {
  const listeners: Record<string, Array<() => void>> = {};
  return {
    src: '',
    paused: true,
    currentTime: 0,
    play: vi.fn().mockResolvedValue(undefined),
    addEventListener: vi.fn((e: string, cb: () => void) => {
      (listeners[e] ??= []).push(cb);
    }),
    removeEventListener: vi.fn(),
    __emit: (e: string) => (listeners[e] ?? []).forEach((f) => f()),
  } as unknown as HTMLAudioElement;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('resolveTrackSrc', () => {
  it('streams from Jellyfin when not downloaded', async () => {
    vi.mocked(isDownloaded).mockReturnValue(false);
    expect(await resolveTrackSrc('t1')).toBe('https://jf.test/Audio/t1/universal');
  });

  it('uses the local blob when downloaded', async () => {
    vi.mocked(isDownloaded).mockReturnValue(true);
    vi.mocked(localAudioUrl).mockResolvedValue('blob:local/t1');
    expect(await resolveTrackSrc('t1')).toBe('blob:local/t1');
  });

  it('falls back to the stream if the blob has gone missing', async () => {
    vi.mocked(isDownloaded).mockReturnValue(true);
    vi.mocked(localAudioUrl).mockResolvedValue(null);
    expect(await resolveTrackSrc('t1')).toBe('https://jf.test/Audio/t1/universal');
  });
});

describe('startPlayback', () => {
  it('does nothing when inactive', () => {
    const audio = fakeAudio();
    startPlayback(audio, 'u', 't1', () => false, { current: false }, log);
    expect(audio.src).toBe('');
    expect(audio.play).not.toHaveBeenCalled();
  });

  it('sets src but does not autoplay a session-restored track (skipAutoPlay)', () => {
    const audio = fakeAudio();
    const skip = { current: true };
    startPlayback(audio, 'u', 't1', () => true, skip, log);
    expect(audio.src).toBe('u');
    expect(audio.play).not.toHaveBeenCalled();
    expect(skip.current).toBe(false); // consumed
  });

  it('resets currentTime to 0 so the next track starts from the beginning', () => {
    const audio = fakeAudio();
    (audio as unknown as { currentTime: number }).currentTime = 240; // prior track's end
    startPlayback(audio, 'u', 't1', () => true, { current: false }, log);
    expect(audio.currentTime).toBe(0);
  });

  it('plays and retries on canplay if still paused', () => {
    const audio = fakeAudio();
    startPlayback(audio, 'u', 't1', () => true, { current: false }, log);
    expect(audio.play).toHaveBeenCalledTimes(1);
    (audio as unknown as { __emit: (e: string) => void }).__emit('canplay');
    expect(audio.play).toHaveBeenCalledTimes(2);
  });

  it('does not retry on canplay once no longer active', () => {
    const audio = fakeAudio();
    let active = true;
    startPlayback(audio, 'u', 't1', () => active, { current: false }, log);
    active = false;
    (audio as unknown as { __emit: (e: string) => void }).__emit('canplay');
    expect(audio.play).toHaveBeenCalledTimes(1); // initial only
  });

  it('returns a cleanup that removes the canplay listener', () => {
    const audio = fakeAudio();
    const cleanup = startPlayback(audio, 'u', 't1', () => true, { current: false }, log);
    cleanup();
    expect(audio.removeEventListener).toHaveBeenCalledWith('canplay', expect.any(Function));
  });

  it('retries on the FIRST canplay only — a later one never restarts a paused track', () => {
    const audio = new FakeAudio();
    startPlayback(audio, 'u', 't1', () => true, { current: false }, log);
    audio.pause(); // the user pauses
    const play = vi.spyOn(audio, 'play');
    audio.fire('canplay'); // the load's first canplay: retry is legitimate
    expect(play).toHaveBeenCalledTimes(1);
    audio.pause();
    audio.fire('canplay'); // after a seek, say — must not restart
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('never retries once the user no longer wants sound', () => {
    const audio = new FakeAudio();
    let wants = true;
    startPlayback(
      audio,
      'u',
      't1',
      () => true,
      { current: false },
      log,
      () => wants,
    );
    audio.pause();
    wants = false;
    const play = vi.spyOn(audio, 'play');
    audio.fire('canplay');
    expect(play).not.toHaveBeenCalled();
  });
});
