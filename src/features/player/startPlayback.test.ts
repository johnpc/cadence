import { afterEach, describe, expect, it, vi } from 'vitest';
import { startPlayback, resolveTrackSrc } from './startPlayback';

vi.mock('../../lib/diagnostics/diagnosticsStore', () => ({ log: vi.fn() }));
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
    startPlayback(audio, 'u', 't1', () => false, { current: false });
    expect(audio.src).toBe('');
    expect(audio.play).not.toHaveBeenCalled();
  });

  it('sets src but does not autoplay a session-restored track (skipAutoPlay)', () => {
    const audio = fakeAudio();
    const skip = { current: true };
    startPlayback(audio, 'u', 't1', () => true, skip);
    expect(audio.src).toBe('u');
    expect(audio.play).not.toHaveBeenCalled();
    expect(skip.current).toBe(false); // consumed
  });

  it('plays and retries on canplay if still paused', () => {
    const audio = fakeAudio();
    startPlayback(audio, 'u', 't1', () => true, { current: false });
    expect(audio.play).toHaveBeenCalledTimes(1);
    (audio as unknown as { __emit: (e: string) => void }).__emit('canplay');
    expect(audio.play).toHaveBeenCalledTimes(2);
  });

  it('does not retry on canplay once no longer active', () => {
    const audio = fakeAudio();
    let active = true;
    startPlayback(audio, 'u', 't1', () => active, { current: false });
    active = false;
    (audio as unknown as { __emit: (e: string) => void }).__emit('canplay');
    expect(audio.play).toHaveBeenCalledTimes(1); // initial only
  });

  it('returns a cleanup that removes the canplay listener', () => {
    const audio = fakeAudio();
    const cleanup = startPlayback(audio, 'u', 't1', () => true, { current: false });
    cleanup();
    expect(audio.removeEventListener).toHaveBeenCalledWith('canplay', expect.any(Function));
  });
});
