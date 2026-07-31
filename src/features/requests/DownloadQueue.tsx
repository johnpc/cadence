import { useQuery } from '@tanstack/react-query';
import { getDownloadQueue } from './lidarrQueue';
import type { DownloadStatus } from './lidarrTypes';
import './requests.css';

/** Short label for a non-downloading queue row (a plain download shows its %). */
function statusLabel(status: DownloadStatus): string {
  if (status === 'paused') return 'Paused';
  if (status === 'importing') return 'Importing…';
  if (status === 'import failed') return 'Import failed';
  if (status === 'completed') return 'Done';
  return 'Downloading';
}

/** The "Downloading" section on the Requests screen: Lidarr's active download
 * queue, polled every 5s so a just-requested artist is visible until it lands.
 * Each row is labelled with the requested ARTIST (the raw release name is a
 * subtitle) and a human status, so a paused / import-failed grab reads clearly
 * instead of a frozen progress bar. Empty queue → renders nothing. */
export function DownloadQueue() {
  const q = useQuery({
    queryKey: ['lidarr-queue'],
    queryFn: getDownloadQueue,
    refetchInterval: 5000,
    staleTime: 0,
  });
  const items = q.data ?? [];
  if (items.length === 0) return null;
  return (
    <section className="download-queue" data-testid="download-queue">
      <h2 className="cad-kicker download-queue__title">Downloading</h2>
      {items.map((d) => (
        <div className="download-queue__row" data-testid="download-queue-row" key={d.id}>
          <div className="download-queue__meta">
            <span className="download-queue__name">{d.title}</span>
            {d.release && <span className="download-queue__release cad-meta">{d.release}</span>}
          </div>
          <div
            className="download-queue__bar"
            role="progressbar"
            aria-valuenow={d.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`download-queue__fill download-queue__fill--${d.status.replace(' ', '-')}`}
              style={{ width: `${d.percent}%` }}
            />
          </div>
          <span className="download-queue__pct cad-meta" data-testid="download-queue-status">
            {d.status === 'downloading' ? `${d.percent}%` : statusLabel(d.status)}
          </span>
        </div>
      ))}
    </section>
  );
}
