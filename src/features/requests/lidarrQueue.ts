import { lidarrGet } from './lidarrApi';
import type { LidarrQueueItem, DownloadProgress } from './lidarrTypes';

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

/** The current Lidarr download queue as title + progress rows, for the Requests
 * screen's "Downloading" section — so a request's progress is visible until it
 * lands in the library. Empty (the common case) → []; a fetch failure → [] too
 * (the section just hides rather than erroring the whole screen). */
export async function getDownloadQueue(): Promise<DownloadProgress[]> {
  try {
    const env = await lidarrGet<QueueEnvelope>('/queue?pageSize=100&includeArtist=true');
    return (env.records ?? []).map((r) => ({
      id: r.id,
      title: r.title ?? 'Downloading…',
      percent: percentOf(r),
    }));
  } catch {
    return [];
  }
}
