import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attachPlaybackReporting, REPORT_INTERVAL_MS, type ReportApi } from './playbackReporting';
import { startQueue } from '../queue';
import { flush, startedEngine, track } from '../../../test/engineHarness';

function api(): { [K in keyof ReportApi]: ReturnType<typeof vi.fn> } & ReportApi {
  return {
    start: vi.fn(() => Promise.resolve()),
    progress: vi.fn(() => Promise.resolve()),
    stopped: vi.fn(() => Promise.resolve()),
    save: vi.fn(() => Promise.resolve()),
    beacon: vi.fn(() => true),
  };
}

describe('attachPlaybackReporting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('a restored, never-played track reports nothing', () => {
    const { engine } = startedEngine({ queue: startQueue([track('a')]) });
    const reports = api();
    const off = attachPlaybackReporting(engine, vi.fn(), reports);
    vi.advanceTimersByTime(REPORT_INTERVAL_MS * 3);
    off();
    expect(reports.start).not.toHaveBeenCalled();
    expect(reports.stopped).not.toHaveBeenCalled();
  });

  it('Start when really playing, Progress from then on, Stopped on track change', async () => {
    const { engine, audio } = startedEngine();
    const reports = api();
    const onReported = vi.fn();
    attachPlaybackReporting(engine, onReported, reports);
    engine.playQueue([track('a'), track('b')], 0);
    expect(reports.start).toHaveBeenCalledWith('a');
    await flush();
    expect(onReported).toHaveBeenCalledOnce();
    audio.tick(12);
    vi.advanceTimersByTime(REPORT_INTERVAL_MS);
    expect(reports.progress).toHaveBeenCalledWith('a', 12);
    engine.pause();
    engine.play(); // same track again: no second Start
    expect(reports.start).toHaveBeenCalledTimes(1);
    engine.next();
    expect(reports.stopped).toHaveBeenCalledWith('a', 12);
    expect(reports.start).toHaveBeenLastCalledWith('b');
    expect(reports.save).not.toHaveBeenCalled(); // music keeps no resume position
  });

  it('skips a Progress tick at position 0 and a failed Start does not fire onReported', async () => {
    const { engine } = startedEngine();
    const reports = api();
    reports.start.mockReturnValue(Promise.reject(new Error('offline')));
    const onReported = vi.fn();
    attachPlaybackReporting(engine, onReported, reports);
    engine.playQueue([track('a')], 0);
    vi.advanceTimersByTime(REPORT_INTERVAL_MS);
    await flush();
    expect(reports.progress).not.toHaveBeenCalled();
    expect(onReported).not.toHaveBeenCalled();
  });

  it('audiobooks save their position after each report and beacon it on pagehide', async () => {
    const { engine, audio } = startedEngine();
    const reports = api();
    const off = attachPlaybackReporting(engine, vi.fn(), reports);
    engine.playQueue([track('bk', { Type: 'AudioBook' })], 0);
    audio.tick(600);
    vi.advanceTimersByTime(REPORT_INTERVAL_MS);
    await flush();
    expect(reports.save).toHaveBeenCalledWith('bk', 600);
    window.dispatchEvent(new Event('pagehide'));
    expect(reports.beacon).toHaveBeenCalledWith('bk', 600);
    off();
    await flush();
    expect(reports.stopped).toHaveBeenCalledWith('bk', 600);
    expect(reports.save).toHaveBeenCalledTimes(2);
  });

  it('a cast does not count as local playback (no Start at position 0)', () => {
    const { engine, cast } = startedEngine({ queue: startQueue([track('a')]) });
    const reports = api();
    attachPlaybackReporting(engine, vi.fn(), reports);
    cast.set({ connected: true, playing: true });
    expect(reports.start).not.toHaveBeenCalled();
  });
});
