import { Skeleton } from '../../components/Skeleton';

/** Placeholder matching the song page's shape (centered art + title + meta over
 * two context cards) so the load reads as the same layout, not a spinner. */
export function SongDetailSkeleton() {
  return (
    <div className="song__skeleton" data-testid="song-skeleton">
      <div className="song__header">
        <Skeleton width={200} height={200} radius={8} />
        <Skeleton width={180} height={22} />
        <Skeleton width={120} height={13} />
        <Skeleton width={90} height={13} />
      </div>
      <div className="song__about">
        {[0, 1].map((i) => (
          <div key={i} className="song-about__card">
            <Skeleton width={96} height={96} radius={8} />
            <div className="song-about__body">
              <Skeleton width={90} height={11} />
              <Skeleton width={140} height={15} />
              <Skeleton width={110} height={12} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
