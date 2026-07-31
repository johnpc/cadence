import { lidarrGet } from './lidarrApi';
import type { LidarrQueueItem, DownloadProgress, DownloadStatus } from './lidarrTypes';

/** Envelope Lidarr wraps its queue in (paged). */
interface QueueEnvelope {
  records?: LidarrQueueItem[];
}

/** Download % from a queue row's size/sizeleft (0 when size is unknown). */
function percentOf(item: LidarrQueueItem): number {
  const size = item.size ?? 0;
  const left = item.sizeleft ?? 0;
  if (size <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - left / size) * 100)));
}

/** Human status from Lidarr's status + trackedDownloadState, so a stalled row
 * reads "Paused"/"Import failed" instead of a frozen bar at 71%.
 * trackedDownloadState is the richer signal (importing/importPending/
 * importFailed); status ('paused'/'completed') is the fallback. */
export function queueStatus(item: LidarrQueueItem): DownloadStatus {
  const state = (item.trackedDownloadState ?? '').toLowerCase();
  const status = (item.status ?? '').toLowerCase();
  if (state.includes('failed') || status.includes('failed')) return 'import failed';
  if (state === 'importing' || state === 'importpending') return 'importing';
  if (status === 'paused') return 'paused';
  if (status === 'completed') return 'completed';
  return 'downloading';
}

/** The current Lidarr download queue as artist + status + progress rows, for the
 * Requests screen's "Downloading" section. Labels each row with the requested
 * ARTIST (not the raw torrent title, which is kept as a subtitle) and a human
 * status so a paused/import-failed grab is legible. Empty (the common case) →
 * []; a fetch failure → [] too (the section hides rather than erroring). */
export async function getDownloadQueue(): Promise<DownloadProgress[]> {
  try {
    const env = await lidarrGet<QueueEnvelope>('/queue?pageSize=100&includeArtist=true');
    return (env.records ?? []).map((r) => ({
      id: r.id,
      title: r.artist?.artistName ?? r.title ?? 'Downloading…',
      release: r.artist?.artistName ? r.title : undefined,
      status: queueStatus(r),
      percent: percentOf(r),
    }));
  } catch {
    return [];
  }
}
