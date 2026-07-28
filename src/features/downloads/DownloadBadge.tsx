import { IonIcon } from '@ionic/react';
import { arrowDownCircle } from 'ionicons/icons';
import './downloadBadge.css';

/** How a badge should render, independent of where the source data comes from
 * (a single track vs a whole collection). */
export interface BadgeState {
  /** 'downloaded' → filled check; 'downloading' → progress ring; else nothing. */
  status: 'none' | 'downloading' | 'downloaded';
  /** 0..1, only meaningful while downloading. */
  fraction?: number;
}

/**
 * A small status badge shown on any downloadable thing — a track row, or an
 * album/playlist tile — indicating whether it's saved offline, mid-download
 * (with a live %), or not saved. Renders NOTHING when there's nothing to show
 * (status 'none'), so it can be dropped anywhere without reserving space.
 *
 * The downloading state is a conic-gradient ring driven by `--frac` (0..1) so
 * the fill animates smoothly with progress; downloaded is a solid accent check.
 */
export function DownloadBadge({ status, fraction = 0 }: BadgeState) {
  if (status === 'none') return null;
  if (status === 'downloaded') {
    return (
      <span
        className="dl-badge dl-badge--done"
        data-testid="download-badge"
        data-status="downloaded"
        aria-label="Downloaded"
        title="Downloaded"
      >
        <IonIcon icon={arrowDownCircle} aria-hidden="true" />
      </span>
    );
  }
  const pct = Math.round(fraction * 100);
  return (
    <span
      className="dl-badge dl-badge--progress"
      data-testid="download-badge"
      data-status="downloading"
      style={{ ['--frac' as string]: fraction }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Downloading, ${pct}%`}
      title={`Downloading… ${pct}%`}
    >
      <span className="dl-badge__pct">{pct}</span>
    </span>
  );
}
