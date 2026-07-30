import { formatTime } from './playerFormat';
import { usePlayerProgress } from './PlayerProgressContext';
import { useScrubber } from './useScrubber';

/** The mini-player's slim progress bar + drag-to-seek range input. Reads the
 * fast-changing progress (position/duration) HERE — not in NowPlayingBar — so
 * the ~4Hz `timeupdate` tick during playback re-renders only this small bar, not
 * the whole mini-player (track art/title/like/buttons) shown on every screen.
 * Takes just the stable `seek` callback from the parent. */
export function NowPlayingSeek({ seek }: { seek: (seconds: number) => void }) {
  const { position, duration } = usePlayerProgress();
  const scrub = useScrubber(position, seek);
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
