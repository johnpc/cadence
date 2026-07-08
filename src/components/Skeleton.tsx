import './skeleton.css';

/** A single shimmering placeholder block. Sizes via width/height/radius. */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = 4,
}: {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
}) {
  return <span className="skeleton" style={{ width, height, borderRadius: radius }} />;
}

/** A row of square card placeholders — matches a Home shelf while it loads. */
export function ShelfSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="skeleton-shelf" data-testid="skeleton-shelf">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-shelf__card">
          <Skeleton width={140} height={140} radius={8} />
          <Skeleton width={110} height={12} />
          <Skeleton width={70} height={10} />
        </div>
      ))}
    </div>
  );
}

/** A stack of track-row placeholders — matches a track list while it loads. */
export function TrackListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="skeleton-list" data-testid="skeleton-list">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-list__row">
          <Skeleton width={44} height={44} radius={4} />
          <div className="skeleton-list__meta">
            <Skeleton width="60%" height={13} />
            <Skeleton width="40%" height={11} />
          </div>
        </div>
      ))}
    </div>
  );
}
