import type { ReactNode } from 'react';
import { imageUrl } from '../../lib/jellyfinStream';
import { useDominantColor } from './useDominantColor';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './gradientHeader.css';

/** Wraps a detail-page header in a Spotify-style ambient gradient sampled from
 * the item's cover art. Falls back to a neutral surface until the colour loads
 * (or if the art can't be sampled). */
export function GradientHeader({
  item,
  children,
}: {
  item: JellyfinItem | null;
  children: ReactNode;
}) {
  const src = item ? imageUrl(item, 64) : null;
  const color = useDominantColor(src);
  return (
    <div
      className="gradient-header"
      data-testid="gradient-header"
      style={color ? { background: `linear-gradient(${color} 0%, transparent 100%)` } : undefined}
    >
      {children}
    </div>
  );
}
