import type { ReactNode } from 'react';
import { useScrubber } from '../player/useScrubber';
import { formatTime } from '../player/playerFormat';
import { formatRemaining } from './chapterProgress';
import type { PositionPhase } from '../player/engine/types';
import './progressRow.css';

/** Where "· 9h 15m left" goes: nowhere, after the times on the label line, or
 * on its own line beneath (narrow sheets, so a long book title never truncates). */
export type RemainingPlacement = 'none' | 'inline' | 'below';

/** The placeholder while the playhead isn't known yet (a resume still landing). */
const PENDING_TIME = '— / —';

/**
 * One labelled, seekable progress bar: a label on the left (which chapter / which
 * book — a button when `onLabel` is set, e.g. to open the chapter list),
 * "elapsed / total" on the right, and optionally the time left at the playback
 * speed. While `phase` is `pending` the bar is empty and the times are dashes, so
 * a resume never flashes 0:00 first. `trailing` sits at the end of the
 * remaining line (the read-along sheet's speed pill).
 */
export function ProgressRow({
  testId,
  label,
  position,
  duration,
  rate,
  remaining,
  size,
  phase = 'known',
  onSeek,
  onLabel,
  trailing,
}: {
  testId: string;
  label: string;
  position: number;
  duration: number;
  rate: number;
  remaining: RemainingPlacement;
  size: 'primary' | 'secondary';
  phase?: PositionPhase;
  onSeek: (seconds: number) => void;
  onLabel?: () => void;
  trailing?: ReactNode;
}) {
  const scrub = useScrubber(position, onSeek);
  const pending = phase === 'pending';
  const value = pending ? 0 : Math.min(scrub.value, duration || 0);
  const left = pending ? '' : formatRemaining((duration - value) / (rate > 0 ? rate : 1));
  const times = pending ? PENDING_TIME : `${formatTime(value)} / ${formatTime(duration)}`;
  return (
    <div className={`progress-row progress-row--${size}`} data-testid={testId} data-phase={phase}>
      <input
        type="range"
        min={0}
        max={pending ? 0 : duration || 0}
        value={value}
        disabled={pending}
        onChange={(e) => scrub.onInput(Number(e.currentTarget.value))}
        onPointerUp={scrub.onCommit}
        onKeyUp={scrub.onCommit}
        onBlur={scrub.onCommit}
        aria-label={`Seek in ${label}`}
        aria-valuetext={
          pending ? 'Loading position' : `${formatTime(value)} of ${formatTime(duration)}`
        }
      />
      <div className="progress-row__labels cad-meta">
        <Label testId={`${testId}-label`} label={label} onLabel={onLabel} />
        <span className="progress-row__time" data-testid={`${testId}-time`}>
          {times}
          {remaining === 'inline' && left && ` · ${left}`}
        </span>
      </div>
      {(remaining === 'below' || trailing) && (
        <div className="progress-row__below cad-meta">
          <span data-testid={`${testId}-remaining`}>{remaining === 'below' ? left : ''}</span>
          {trailing}
        </div>
      )}
    </div>
  );
}

function Label({
  testId,
  label,
  onLabel,
}: {
  testId: string;
  label: string;
  onLabel?: () => void;
}) {
  if (!onLabel) {
    return (
      <span className="progress-row__label" data-testid={testId}>
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      className="progress-row__label progress-row__label--action"
      onClick={onLabel}
      aria-label={`${label} — show chapters`}
      data-testid={testId}
    >
      {label}
    </button>
  );
}
