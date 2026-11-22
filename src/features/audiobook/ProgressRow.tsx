import { useScrubber } from '../player/useScrubber';
import { formatTime } from '../player/playerFormat';
import { formatRemaining } from './chapterProgress';
import './progressRow.css';

/**
 * One labelled, seekable progress bar: a title on the left (which chapter / which
 * book), "elapsed / total" on the right, optionally "· 9h 15m left" at the playback
 * speed. Dragging shows the drag target and commits one seek on release, like the
 * main scrubber. `size` picks the bar weight: the primary bar is the one you
 * scrub most, the secondary sits beneath it.
 */
export function ProgressRow({
  testId,
  label,
  position,
  duration,
  rate,
  showRemaining,
  size,
  onSeek,
}: {
  testId: string;
  label: string;
  position: number;
  duration: number;
  rate: number;
  showRemaining: boolean;
  size: 'primary' | 'secondary';
  onSeek: (seconds: number) => void;
}) {
  const scrub = useScrubber(position, onSeek);
  const value = Math.min(scrub.value, duration || 0);
  const left = showRemaining
    ? ` · ${formatRemaining((duration - value) / (rate > 0 ? rate : 1))}`
    : '';
  return (
    <div className={`progress-row progress-row--${size}`} data-testid={testId}>
      <input
        type="range"
        min={0}
        max={duration || 0}
        value={value}
        onChange={(e) => scrub.onInput(Number(e.currentTarget.value))}
        onPointerUp={scrub.onCommit}
        onKeyUp={scrub.onCommit}
        onBlur={scrub.onCommit}
        aria-label={`Seek in ${label}`}
        aria-valuetext={`${formatTime(value)} of ${formatTime(duration)}`}
      />
      <div className="progress-row__labels cad-meta">
        <span className="progress-row__label" data-testid={`${testId}-label`}>
          {label}
        </span>
        <span className="progress-row__time" data-testid={`${testId}-time`}>
          {formatTime(value)} / {formatTime(duration)}
          {left}
        </span>
      </div>
    </div>
  );
}
