import { DownloadBadge } from './DownloadBadge';
import { useTrackBadge } from './useTrackBadge';

/** The download badge for a single track, wired to the live download/progress
 * stores. Renders nothing unless the track is downloaded or downloading, so it's
 * safe to drop into every track row. */
export function TrackDownloadBadge({ id }: { id: string }) {
  return <DownloadBadge {...useTrackBadge(id)} />;
}
