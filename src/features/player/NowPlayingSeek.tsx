import { formatTime } from './playerFormat';
import type { useScrubber } from './useScrubber';

/** The mini-player's slim progress bar + drag-to-seek range input. Extracted
 * from NowPlayingBar to keep that file within the line budget. */
export function NowPlayingSeek({
  scrub,
  duration,
}: {
  scrub: ReturnType<typeof useScrubber>;
  duration: number;
}) {
  const pct = duration > 0 ? Math.min(100, (scrub.value / duration) * 100) : 0;
  return (
    <div className="npbar__progress" data-testid="now-playing-progress">
      <div className="npbar__progress-fill" style={{ width: `${pct}%` }} />
      <input
        className="npbar__seek"
        type="range"
        min={0}
        max={duration || 0}
        value={Math.min(scrub.value, duration || 0)}
        onChange={(e) => scrub.onInput(Number(e.currentTarget.value))}
        onPointerUp={scrub.onCommit}
        onKeyUp={scrub.onCommit}
        onBlur={scrub.onCommit}
        aria-label="Seek"
        aria-valuetext={`${formatTime(scrub.value)} of ${formatTime(duration)}`}
        data-testid="now-playing-seek"
      />
    </div>
  );
}
