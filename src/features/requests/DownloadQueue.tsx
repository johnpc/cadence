import { useQuery } from '@tanstack/react-query';
import { getDownloadQueue } from './lidarrQueue';
import './requests.css';

/** The "Downloading" section on the Requests screen: Lidarr's active download
 * queue with per-release progress, polled every 5s so a just-requested artist's
 * download is visible until it lands in the library. Renders nothing when the
 * queue is empty (the usual state) so it never shows an empty box. */
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
          <span className="download-queue__name">{d.title}</span>
          <div
            className="download-queue__bar"
            role="progressbar"
            aria-valuenow={d.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="download-queue__fill" style={{ width: `${d.percent}%` }} />
          </div>
          <span className="download-queue__pct cad-meta">{d.percent}%</span>
        </div>
      ))}
    </section>
  );
}
