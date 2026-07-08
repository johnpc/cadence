import { useEffect, useState } from 'react';
import { averageColor, darken, rgbCss, type Rgb } from './dominantColor';

/** Sample the dominant colour of an image URL (via a tiny off-screen canvas)
 * and return it as a darkened `rgb(...)` string for a header gradient — or null
 * until it resolves / if it can't be sampled. Jellyfin serves art with CORS
 * `*`, so a crossOrigin load can read the pixels. */
export function useDominantColor(src: string | null): string | null {
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    if (!src) {
      setColor(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      try {
        const size = 24;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        const avg: Rgb = darken(averageColor(data, 1), 0.25);
        if (!cancelled) setColor(rgbCss(avg));
      } catch {
        /* tainted canvas / decode failure — leave the default background */
      }
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return color;
}
