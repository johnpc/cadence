// @vitest-environment node
/**
 * The player's behaviour, end to end through the engine — no DOM, no React.
 * Every case that used to live in a dozen hook tests (useTrackLoader,
 * usePlaybackHandlers, useStallWatchdog, usePlaybackControls, usePlayerQueue,
 * useSleepTimer, useVolume, usePlaybackRate, useSmartPrev, useAudiobookResume…)
 * is here, against one state machine.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPlayerEngine } from './createPlayerEngine';
import { startQueue } from '../queue';
import { setPendingSeek, takePendingSeek } from '../pendingSeek';
import { fakePlatform, flush, startedEngine, track } from '../../../test/engineHarness';

const ab = () => [track('a'), track('b')];
const abc = () => [track('a'), track('b'), track('c')];

afterEach(() => {
  vi.useRealTimers();
  takePendingSeek('a');
  takePendingSeek('b');
});

describe('loading', () => {
  it('starts idle and plays a queue: loads the first track and autoplays', () => {
    const { engine, audio, deps, status } = startedEngine();
    expect(status()).toBe('idle');
    engine.playQueue(ab(), 0);
    expect(audio.src).toBe('https://jf.test/Audio/a/universal');
    expect(status()).toBe('playing');
    expect(engine.state.get()).toMatchObject({ intent: true, started: true });
    expect(deps.onAudible).toHaveBeenCalled();
    expect(deps.attach).toHaveBeenCalledOnce();
  });

  it('a queue restored at launch loads PAUSED (no autoplay)', () => {
    const { audio, status } = startedEngine({ queue: startQueue(ab(), 1) });
    expect(audio.src).toContain('/Audio/b/');
    expect(audio.paused).toBe(true);
    expect(status()).toBe('paused');
  });

  it('waits for the session before loading, then loads the restored track paused', () => {
    const { audio, session, status } = startedEngine({ queue: startQueue(ab()), userId: '' });
    expect(audio.src).toBe('');
    session.set('user-1');
    expect(audio.src).toContain('/Audio/a/');
    expect(status()).toBe('paused');
  });

  it('a later track change autoplays and re-applies volume + speed', () => {
    const { engine, audio } = startedEngine({ queue: startQueue(ab()), volume: 0.5, rate: 1.5 });
    engine.next();
    expect(audio.src).toContain('/Audio/b/');
    expect(audio.paused).toBe(false);
    expect(audio.volume).toBe(0.5);
    expect(audio.defaultPlaybackRate).toBe(1.5);
    expect(audio.playbackRate).toBe(1.5);
  });

  it('plays a downloaded track from its async local src; a newer load wins', async () => {
    const { engine, audio, deps } = startedEngine();
    let resolveSlow: (src: string) => void = () => undefined;
    deps.resolveSrc.mockImplementationOnce(
      () => new Promise<string>((resolve) => (resolveSlow = resolve)),
    );
    engine.playQueue(ab(), 0); // 'a' is "downloaded" and slow to resolve
    engine.next(); // the user moves on before it resolves
    resolveSlow('blob:local/a');
    await flush();
    expect(audio.src).toContain('/Audio/b/');
  });

  it('re-playing the same track objects does not reload; a freshly fetched list does', () => {
    const { engine, audio } = startedEngine();
    const tracks = ab();
    engine.playQueue(tracks, 0);
    const loads = audio.loads;
    engine.addToQueue(track('c')); // appending radio keeps the current object
    expect(audio.loads).toBe(loads);
    audio.tick(30);
    engine.playQueue(ab(), 0); // new objects (a refetch) → restart
    expect(audio.currentTime).toBe(0);
  });

  it('resets progress for a new track and tracks position + duration', () => {
    const { engine, audio } = startedEngine();
    engine.playQueue(ab(), 0);
    audio.loadMetadata(200);
    audio.tick(12);
    expect(engine.progress.get()).toEqual({ position: 12, duration: 200 });
    expect(engine.position()).toBe(12);
    engine.next();
    expect(engine.progress.get()).toEqual({ position: 0, duration: 0 });
  });

  it('logs a rejected autoplay play() instead of throwing', async () => {
    const { engine, audio, deps } = startedEngine();
    audio.rejectNextPlay = new Error('NotAllowedError');
    engine.playQueue(ab(), 0);
    await flush();
    expect(deps.log).toHaveBeenCalledWith('play-rejected', 'play() rejected', expect.anything());
  });
});

describe('transport state', () => {
  it('buffering shows the spinner; resuming clears it', () => {
    const { engine, audio, status } = startedEngine();
    engine.playQueue(ab(), 0);
    audio.fire('waiting');
    expect(status()).toBe('buffering');
    audio.fire('playing');
    expect(status()).toBe('playing');
  });

  it('a pause mid-stall ends buffering — the spinner never latches over a paused track', () => {
    const { engine, audio, status } = startedEngine();
    engine.playQueue(ab(), 0);
    audio.fire('canplay'); // the load's own canplay
    audio.fire('waiting');
    engine.pause();
    expect(status()).toBe('paused');
    audio.fire('canplay');
    expect(status()).toBe('paused');
  });

  it('a pause before the stream is ready is not undone by the canplay retry', () => {
    const { engine, audio, status } = startedEngine();
    engine.playQueue(ab(), 0);
    engine.toggle(); // Space pressed immediately
    audio.fire('canplay'); // the stream becomes ready afterwards
    expect(status()).toBe('paused');
    expect(audio.paused).toBe(true);
  });

  it('a `waiting` on a paused element is not buffering', () => {
    const { audio, status } = startedEngine({ queue: startQueue(ab()) });
    audio.fire('waiting');
    expect(status()).toBe('paused');
  });

  it('toggle acts on what the UI shows, not audio.paused (iOS desync)', () => {
    const { engine, audio, deps, status } = startedEngine();
    engine.playQueue(ab(), 0);
    engine.toggle();
    expect(status()).toBe('paused');
    expect(engine.state.get().intent).toBe(false);
    audio.paused = false; // iOS: "not paused" after an interruption, yet silent
    engine.toggle();
    expect(engine.state.get().intent).toBe(true);
    expect(deps.haptic).toHaveBeenCalledTimes(2);
  });

  it('toggle / play are no-ops with an empty queue', () => {
    const { engine, deps, audio } = startedEngine();
    engine.toggle();
    engine.play();
    expect(deps.haptic).not.toHaveBeenCalled();
    expect(audio.paused).toBe(true);
  });

  it('play logs a rejected play()', async () => {
    const { engine, audio, deps } = startedEngine({ queue: startQueue(ab()) });
    audio.rejectNextPlay = new Error('AbortError');
    engine.play();
    await flush();
    expect(deps.log).toHaveBeenCalledWith('play-rejected', 'explicit play() rejected', {
      reason: 'Error',
    });
  });

  it('resume plays even when the element claims it is not paused; never with no queue', () => {
    const { engine, audio } = startedEngine();
    engine.resume();
    expect(audio.paused).toBe(true);
    engine.playQueue(ab(), 0);
    audio.paused = false;
    const play = vi.spyOn(audio, 'play');
    engine.resume();
    expect(play).toHaveBeenCalled();
  });

  it('seek and seekBy move the element, clamped to [0, duration]', () => {
    const { engine, audio } = startedEngine({ queue: startQueue(ab()) });
    engine.seek(42);
    expect(audio.currentTime).toBe(42);
    audio.duration = 50;
    engine.seekBy(30);
    expect(audio.currentTime).toBe(50);
    engine.seekBy(-80);
    expect(audio.currentTime).toBe(0);
    audio.duration = Number.NaN;
    engine.seekBy(5);
    expect(audio.currentTime).toBe(5);
  });

  it('smart prev restarts deep into a track, else goes back', () => {
    const { engine, audio } = startedEngine();
    engine.playQueue(ab(), 1);
    audio.tick(30);
    engine.prev();
    expect(engine.state.get().queue.index).toBe(1);
    expect(audio.currentTime).toBe(0);
    audio.tick(1);
    engine.prev();
    expect(engine.state.get().queue.index).toBe(0);
  });
});

describe('end of track', () => {
  it('advances to the next track', () => {
    const { engine, audio } = startedEngine();
    engine.playQueue(ab(), 0);
    audio.finish();
    expect(engine.state.get().queue.index).toBe(1);
    expect(audio.src).toContain('/Audio/b/');
  });

  it('at the end of the queue (repeat off) says so and stays', () => {
    const { engine, audio, deps, status } = startedEngine();
    engine.playQueue(ab(), 1);
    audio.finish();
    expect(deps.notify).toHaveBeenCalledWith("You've reached the end of the queue.");
    expect(engine.state.get().queue.index).toBe(1);
    expect(status()).toBe('paused');
  });

  it('repeat-one replays in place; repeat-all wraps', () => {
    const { engine, audio, deps } = startedEngine();
    engine.playQueue(ab(), 1);
    engine.cycleRepeat(); // all
    audio.finish();
    expect(engine.state.get().queue.index).toBe(0);
    engine.cycleRepeat(); // one
    audio.tick(80);
    audio.finish();
    expect(engine.state.get().queue.index).toBe(0);
    expect(audio.currentTime).toBe(0);
    expect(audio.paused).toBe(false);
    expect(deps.notify).not.toHaveBeenCalled();
    expect(deps.persist.modes).toHaveBeenLastCalledWith({ shuffle: false, repeat: 'one' });
  });

  it('"stop after this track" pauses and disarms instead of advancing', () => {
    const { engine, audio } = startedEngine();
    engine.playQueue(ab(), 0);
    engine.armSleep('track');
    audio.finish();
    expect(engine.state.get().queue.index).toBe(0);
    expect(engine.state.get()).toMatchObject({ sleep: null, intent: false });
  });
});

describe('recovery', () => {
  it('retries the same track first (keeping the place), then skips', async () => {
    const { engine, audio, deps } = startedEngine();
    engine.playQueue(ab(), 0);
    audio.tick(95);
    audio.fire('error');
    await flush();
    expect(deps.notify).toHaveBeenLastCalledWith('Trouble playing that — retrying…');
    expect(engine.state.get().queue.index).toBe(0);
    expect(takePendingSeek('a')).toBe(95);
    audio.fire('error');
    await flush();
    expect(deps.notify).toHaveBeenLastCalledWith("Couldn't play that track — skipping.");
    expect(engine.state.get().queue.index).toBe(1);
  });

  it('a retry right at the start leaves no pending seek behind', async () => {
    const { engine, audio } = startedEngine();
    engine.playQueue(ab(), 0);
    audio.fire('error');
    await flush();
    expect(takePendingSeek('a')).toBeNull();
  });

  it('at the last track it gives up without a dead-end "skipping"', async () => {
    const { engine, audio, deps, status } = startedEngine();
    engine.playQueue([track('a')], 0);
    audio.fire('error');
    await flush();
    audio.fire('error');
    await flush();
    expect(deps.notify).toHaveBeenLastCalledWith("Couldn't play that track.");
    expect(status()).toBe('paused');
  });

  it('stays silent for a restored track that errors before playback ever started', async () => {
    const { audio, deps } = startedEngine({ queue: startQueue(ab()) });
    audio.fire('error');
    await flush();
    expect(deps.notify).not.toHaveBeenCalled();
  });

  it('gives each new track its own retry budget', async () => {
    const { engine, audio, deps } = startedEngine();
    engine.playQueue(abc(), 0);
    audio.fire('error');
    await flush();
    audio.fire('error');
    await flush(); // skip a → b
    audio.fire('error');
    await flush();
    expect(deps.notify).toHaveBeenLastCalledWith('Trouble playing that — retrying…');
  });
});

describe('offline recovery', () => {
  const abcd = () => [track('a'), track('b'), track('c'), track('d')];
  function offlineWith(downloaded: string[]) {
    const h = startedEngine();
    vi.mocked(h.deps.availability.offline).mockReturnValue(true);
    vi.mocked(h.deps.availability.downloaded).mockImplementation((id) => downloaded.includes(id));
    return h;
  }

  it('skips straight past tracks that are not downloaded, with no pointless retry', () => {
    const { engine, audio, deps } = offlineWith(['a', 'd']);
    engine.playQueue(abcd(), 1); // b: not downloaded
    audio.fire('error');
    expect(deps.notify).toHaveBeenLastCalledWith('Not downloaded — skipping to the next download.');
    expect(deps.notify).not.toHaveBeenCalledWith('Trouble playing that — retrying…');
    expect(engine.state.get().queue.index).toBe(3); // d, not c
  });

  it('stops and says so when nothing ahead is downloaded', () => {
    const { engine, audio, deps, status } = offlineWith(['a']);
    engine.playQueue(abcd(), 1);
    audio.fire('error');
    expect(deps.notify).toHaveBeenLastCalledWith(
      'You’re offline — nothing else in this queue is downloaded.',
    );
    expect(engine.state.get().queue.index).toBe(1);
    expect(status()).toBe('paused');
    expect(engine.state.get().intent).toBe(false);
  });

  it('under repeat-all it wraps around to an earlier download', () => {
    const { engine, audio } = offlineWith(['a']);
    engine.playQueue(abcd(), 2);
    engine.cycleRepeat(); // off → all
    audio.fire('error');
    expect(engine.state.get().queue.index).toBe(0);
  });

  it('a DOWNLOADED track that errors offline still gets the normal retry', () => {
    const { engine, audio, deps } = offlineWith(['a', 'b']);
    engine.playQueue(ab(), 0);
    audio.fire('error');
    expect(deps.notify).toHaveBeenLastCalledWith('Trouble playing that — retrying…');
  });

  it('pressing play offline on a restored, not-downloaded track goes to a download', () => {
    // Its launch load failed silently, so no new error fires — play() must act.
    const h = startedEngine({ queue: startQueue(abc(), 0) });
    vi.mocked(h.deps.availability.offline).mockReturnValue(true);
    vi.mocked(h.deps.availability.downloaded).mockImplementation((id) => id === 'c');
    h.engine.play();
    expect(h.deps.notify).toHaveBeenLastCalledWith(
      'Not downloaded — skipping to the next download.',
    );
    expect(h.engine.state.get().queue.index).toBe(2);
  });

  it('pressing play offline with nothing downloaded says so instead of doing nothing', () => {
    const h = startedEngine({ queue: startQueue(ab(), 0) });
    vi.mocked(h.deps.availability.offline).mockReturnValue(true);
    h.engine.toggle();
    expect(h.deps.notify).toHaveBeenLastCalledWith(
      'You’re offline — nothing else in this queue is downloaded.',
    );
    expect(h.engine.state.get().intent).toBe(false);
  });

  it('pressing play offline on a DOWNLOADED track just plays it', () => {
    const h = startedEngine({ queue: startQueue(ab(), 0) });
    vi.mocked(h.deps.availability.offline).mockReturnValue(true);
    vi.mocked(h.deps.availability.downloaded).mockReturnValue(true);
    h.engine.play();
    expect(h.deps.notify).not.toHaveBeenCalled();
    expect(h.engine.state.get().queue.index).toBe(0);
  });

  it('never acts for a restored track the user has not played (no audio on its own)', () => {
    const h = startedEngine({ queue: startQueue(ab()) });
    vi.mocked(h.deps.availability.offline).mockReturnValue(true);
    h.audio.fire('error');
    expect(h.deps.notify).not.toHaveBeenCalled();
    expect(h.engine.state.get().queue.index).toBe(0);
  });
});

describe('a failed stream with no word yet on the connection', () => {
  it('asks the server; unreachable → skips straight to the next download', async () => {
    const h = startedEngine();
    vi.mocked(h.deps.availability.probe).mockResolvedValue(false);
    vi.mocked(h.deps.availability.downloaded).mockImplementation((id) => id === 'c');
    h.engine.playQueue(abc(), 0);
    h.audio.fire('error');
    expect(h.deps.notify).not.toHaveBeenCalled(); // waits for the answer
    await flush();
    expect(h.deps.availability.probe).toHaveBeenCalledOnce();
    expect(h.engine.state.get().queue.index).toBe(2);
    expect(h.deps.notify).toHaveBeenLastCalledWith(
      'Not downloaded — skipping to the next download.',
    );
  });

  it('asks only once while the answer is pending', async () => {
    const h = startedEngine();
    let answer!: (v: boolean) => void;
    vi.mocked(h.deps.availability.probe).mockImplementation(
      () => new Promise<boolean>((res) => (answer = res)),
    );
    h.engine.playQueue(ab(), 0);
    h.audio.fire('error');
    h.audio.fire('error');
    expect(h.deps.availability.probe).toHaveBeenCalledOnce();
    answer(true);
    await flush();
    expect(h.deps.notify).toHaveBeenLastCalledWith('Trouble playing that — retrying…');
  });

  it('does nothing with a late answer once the user has moved to another track', async () => {
    const h = startedEngine();
    let answer!: (v: boolean) => void;
    vi.mocked(h.deps.availability.probe).mockImplementation(
      () => new Promise<boolean>((res) => (answer = res)),
    );
    h.engine.playQueue(abc(), 0);
    h.audio.fire('error');
    h.engine.next();
    answer(false);
    await flush();
    expect(h.deps.notify).not.toHaveBeenCalled();
    expect(h.engine.state.get().queue.index).toBe(1);
  });

  it('a DOWNLOADED track that errors never asks — it retries at once', () => {
    const h = startedEngine();
    vi.mocked(h.deps.availability.downloaded).mockReturnValue(true);
    h.engine.playQueue(ab(), 0);
    h.audio.fire('error');
    expect(h.deps.availability.probe).not.toHaveBeenCalled();
    expect(h.deps.notify).toHaveBeenLastCalledWith('Trouble playing that — retrying…');
  });
});

describe('stall watchdog', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('recovers a stall that outlives the timeout', async () => {
    const { engine, audio, deps } = startedEngine();
    engine.playQueue(ab(), 0);
    audio.fire('waiting');
    vi.advanceTimersByTime(45_000);
    await flush();
    expect(deps.notify).toHaveBeenCalledWith('Trouble playing that — retrying…');
    expect(deps.log).toHaveBeenCalledWith(
      'stall-watchdog',
      'stalled too long — recovering',
      expect.anything(),
    );
  });

  it('progress re-arms it, so only a frozen stream times out', async () => {
    const { engine, audio, deps } = startedEngine();
    engine.playQueue(ab(), 0);
    audio.fire('waiting');
    vi.advanceTimersByTime(40_000);
    audio.tick(3);
    vi.advanceTimersByTime(40_000);
    audio.tick(3); // no movement: does not re-arm
    vi.advanceTimersByTime(5_000);
    await flush();
    expect(deps.notify).toHaveBeenCalledTimes(1);
  });

  it('never fires once the stall resolves, or for a paused / unwanted element', () => {
    const { engine, audio, deps } = startedEngine();
    engine.playQueue(ab(), 0);
    audio.fire('waiting');
    audio.fire('playing');
    vi.advanceTimersByTime(60_000);
    audio.fire('waiting');
    engine.state.set({ ...engine.state.get(), intent: false });
    vi.advanceTimersByTime(60_000);
    audio.fire('playing');
    audio.fire('waiting');
    audio.paused = true; // an interruption paused it without a pause event
    vi.advanceTimersByTime(60_000);
    expect(deps.notify).not.toHaveBeenCalled();
  });
});

describe('stop and sign-out', () => {
  it('stop unloads the element, empties the queue and drops intent', () => {
    const { engine, audio, status, deps } = startedEngine();
    engine.playQueue(ab(), 0);
    engine.stop();
    expect(audio.src).toBe('');
    expect(audio.paused).toBe(true);
    expect(engine.state.get().queue.tracks).toEqual([]);
    expect(engine.state.get().intent).toBe(false);
    expect(status()).toBe('idle');
    expect(deps.cast.stop).not.toHaveBeenCalled();
  });

  it('removing the only track stops playback', () => {
    const { engine, audio, status } = startedEngine();
    engine.playQueue([track('a')], 0);
    engine.removeFromQueue(0);
    expect(audio.src).toBe('');
    expect(status()).toBe('idle');
  });

  it("signing out stops the previous user's playback", () => {
    const { engine, session, status } = startedEngine();
    engine.playQueue(ab(), 0);
    session.set('');
    expect(status()).toBe('idle');
    expect(engine.state.get().queue.tracks).toEqual([]);
  });
});

describe('casting', () => {
  it('hands playback to the TV without loading the track twice', () => {
    const { engine, audio, cast, deps, status } = startedEngine();
    engine.playQueue(ab(), 0);
    cast.set({ connected: true, playing: true });
    expect(status()).toBe('casting');
    expect(audio.paused).toBe(true);
    expect(deps.cast.load).not.toHaveBeenCalled();
    engine.next();
    expect(deps.cast.load).toHaveBeenCalledWith(expect.objectContaining({ Id: 'b' }));
  });

  it('play/pause are directional on the receiver; seek and prev proxy', () => {
    const { engine, cast, deps, audio } = startedEngine();
    engine.playQueue(ab(), 1);
    cast.set({ connected: true, playing: true });
    engine.play(); // already playing: must not toggle it off
    expect(deps.cast.toggle).not.toHaveBeenCalled();
    engine.pause();
    expect(deps.cast.toggle).toHaveBeenCalledTimes(1);
    expect(engine.state.get().status).toBe('casting-paused');
    engine.pause(); // already paused
    expect(deps.cast.toggle).toHaveBeenCalledTimes(1);
    engine.toggle(); // shows paused → plays
    expect(deps.cast.toggle).toHaveBeenCalledTimes(2);
    expect(engine.state.get().status).toBe('casting');
    engine.seek(30);
    expect(deps.cast.seek).toHaveBeenCalledWith(30);
    audio.currentTime = 50;
    engine.prev(); // the receiver owns position: always the previous track
    expect(engine.state.get().queue.index).toBe(0);
    engine.resume(); // never touches the local element while casting
    expect(audio.paused).toBe(true);
  });

  it("follows the TV's own play/pause (its remote) between casting and casting-paused", () => {
    const { engine, cast, status } = startedEngine();
    engine.playQueue(ab(), 0);
    cast.set({ connected: true, playing: false });
    expect(status()).toBe('casting-paused');
    expect(engine.state.get().status).toBe('casting-paused');
    cast.set({ connected: true, playing: true });
    expect(status()).toBe('casting');
  });

  it('when the cast ends, playback comes back to the phone', () => {
    const { engine, audio, cast, status } = startedEngine();
    engine.playQueue(ab(), 0);
    cast.set({ connected: true, playing: true });
    cast.set({ connected: false, playing: false });
    expect(audio.src).toContain('/Audio/a/');
    expect(audio.paused).toBe(false);
    expect(status()).toBe('playing');
  });

  it('stop also ends the cast', () => {
    const { engine, cast, deps, status } = startedEngine();
    engine.playQueue(ab(), 0);
    cast.set({ connected: true, playing: true });
    engine.stop();
    expect(deps.cast.stop).toHaveBeenCalled();
    expect(status()).toBe('idle');
  });
});

describe('sleep timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('pauses after the armed minutes and clears', () => {
    const { engine } = startedEngine();
    engine.playQueue(ab(), 0);
    engine.armSleep(5);
    expect(engine.state.get().sleep).toBe(5);
    vi.advanceTimersByTime(5 * 60_000);
    expect(engine.state.get()).toMatchObject({ sleep: null, status: 'paused' });
  });

  it('re-arming resets the countdown; null or junk cancels', () => {
    const { engine } = startedEngine();
    engine.playQueue(ab(), 0);
    engine.armSleep(5);
    vi.advanceTimersByTime(4 * 60_000);
    engine.armSleep(5);
    vi.advanceTimersByTime(4 * 60_000);
    expect(engine.state.get().status).toBe('playing');
    engine.armSleep(null);
    vi.advanceTimersByTime(10 * 60_000);
    expect(engine.state.get().status).toBe('playing');
    engine.armSleep(-3);
    expect(engine.state.get().sleep).toBeNull();
  });
});

describe('levels', () => {
  it('volume clamps, persists, applies; mute restores the prior level', () => {
    const { engine, audio, deps } = startedEngine();
    engine.setVolume(1.7);
    expect(audio.volume).toBe(1);
    engine.setVolume(0.6);
    engine.nudgeVolume(0.1);
    expect(engine.state.get().volume).toBeCloseTo(0.7);
    engine.toggleMute();
    expect(audio.volume).toBe(0);
    engine.toggleMute();
    expect(audio.volume).toBeCloseTo(0.7);
    expect(deps.persist.volume.mock.lastCall?.[0]).toBeCloseTo(0.7);
  });

  it('unmuting from a manual zero goes back to full volume', () => {
    const { engine } = startedEngine({ volume: 0 });
    engine.toggleMute();
    expect(engine.state.get().volume).toBe(1);
  });

  it('speed snaps to a step, persists, and survives the next load', () => {
    const { engine, audio, deps } = startedEngine();
    engine.setRate(1.6);
    expect(engine.state.get().rate).toBe(1.5);
    expect(deps.persist.rate).toHaveBeenLastCalledWith(1.5);
    engine.playQueue(ab(), 0);
    expect(audio.defaultPlaybackRate).toBe(1.5);
  });
});

describe('queue commands', () => {
  it('persists every queue change', () => {
    const { engine, deps } = startedEngine();
    engine.playQueue(ab(), 0);
    expect(deps.persist.queue).toHaveBeenLastCalledWith(
      expect.objectContaining({ index: 0, tracks: expect.any(Array) }),
    );
  });

  it('playNext inserts after current; addToQueue appends, seeds, ignores empty', () => {
    const { engine } = startedEngine();
    engine.addToQueue([]);
    expect(engine.state.get().queue.tracks).toEqual([]);
    engine.addToQueue(track('a'));
    engine.addToQueue([track('c')]);
    engine.playNext(track('b'));
    expect(engine.state.get().queue.tracks.map((t) => t.Id)).toEqual(['a', 'b', 'c']);
  });

  it('jumpTo clamps and ignores the current index; move + clear keep current', () => {
    const { engine, deps } = startedEngine();
    engine.playQueue(abc(), 0);
    const saves = deps.persist.queue.mock.calls.length;
    engine.jumpTo(0);
    expect(deps.persist.queue.mock.calls.length).toBe(saves);
    engine.jumpTo(99);
    expect(engine.state.get().queue.index).toBe(2);
    engine.moveInQueue(2, 0);
    expect(engine.state.get().queue).toMatchObject({ index: 0 });
    engine.clearQueue();
    expect(engine.state.get().queue.tracks.map((t) => t.Id)).toEqual(['c']);
  });

  it('shuffle on keeps current first; off restores the order — also after a shuffle-play', () => {
    const { engine } = startedEngine();
    engine.playQueue(abc(), 1);
    engine.toggleShuffle();
    expect(engine.state.get().shuffle).toBe(true);
    expect(engine.state.get().queue.tracks[0].Id).toBe('b');
    engine.toggleShuffle();
    expect(engine.state.get().queue.tracks.map((t) => t.Id)).toEqual(['a', 'b', 'c']);
    engine.playShuffled(abc());
    expect(engine.state.get().shuffle).toBe(true);
    engine.toggleShuffle();
    expect(engine.state.get().queue.tracks.map((t) => t.Id)).toEqual(['a', 'b', 'c']);
  });
});

describe('audiobook resume', () => {
  const book = track('a', { Type: 'AudioBook' });

  it('seeks to the saved position once metadata arrives', async () => {
    const { engine, audio, deps } = startedEngine();
    deps.resumeAt.mockResolvedValue(300);
    engine.playQueue([book], 0);
    audio.loadMetadata(3600);
    await flush();
    expect(audio.currentTime).toBe(300);
    expect(deps.resumeAt).toHaveBeenCalledWith(book, 3600);
  });

  it('never yanks a listener who already scrubbed', async () => {
    const { engine, audio, deps } = startedEngine();
    let resolve: (v: number) => void = () => undefined;
    deps.resumeAt.mockReturnValue(new Promise<number | null>((r) => (resolve = r)));
    engine.playQueue([book], 0);
    audio.loadMetadata(3600);
    audio.currentTime = 900;
    resolve(300);
    await flush();
    expect(audio.currentTime).toBe(900);
  });

  it('a pending chapter seek wins over the saved position (no server read)', () => {
    const { engine, audio, deps } = startedEngine();
    setPendingSeek('a', 1234);
    engine.playQueue([book], 0);
    audio.loadMetadata(3600);
    expect(audio.currentTime).toBe(1234);
    expect(deps.resumeAt).not.toHaveBeenCalled();
  });

  it('an error reload restores the exact pre-error position', () => {
    const { engine, audio } = startedEngine();
    engine.playQueue([book, track('b')], 0);
    audio.loadMetadata(3600);
    audio.tick(1500);
    audio.fire('error');
    audio.loadMetadata(3600);
    expect(audio.currentTime).toBe(1500);
  });

  it('ignores a slow resume for a track the user already left', async () => {
    const { engine, audio, deps } = startedEngine();
    let resolve: (v: number) => void = () => undefined;
    deps.resumeAt.mockReturnValueOnce(new Promise<number | null>((r) => (resolve = r)));
    engine.playQueue([book, track('b')], 0);
    audio.loadMetadata(3600);
    engine.next();
    resolve(300);
    await flush();
    expect(audio.currentTime).toBe(0);
  });
});

describe('lifecycle', () => {
  it('start returns an unbind; starting again (StrictMode) does not reload', () => {
    const { deps, audio } = fakePlatform({ queue: startQueue(ab()) });
    const engine = createPlayerEngine(deps);
    const stop = engine.start();
    expect(audio.listenerCount('ended')).toBe(1);
    const loads = audio.loads;
    stop();
    expect(audio.listenerCount('ended')).toBe(0);
    engine.start();
    expect(audio.loads).toBe(loads);
    expect(audio.listenerCount('ended')).toBe(1);
  });

  it('nothing changes, nothing emits', () => {
    const { engine } = startedEngine();
    const spy = vi.fn();
    engine.state.subscribe(spy);
    engine.setVolume(1);
    engine.pause();
    expect(spy).not.toHaveBeenCalled();
  });
});
