/** An RGB colour, 0–255 per channel. */
export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Average the pixels of an RGBA byte array (as from canvas `getImageData`),
 * skipping transparent and near-white/near-black pixels so the result reflects
 * the artwork's actual hue rather than its borders. Falls back to a plain mean
 * when every pixel is filtered out. Pure — the canvas plumbing lives elsewhere. */
export function averageColor(data: Uint8ClampedArray, step = 4): Rgb {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  let rAll = 0;
  let gAll = 0;
  let bAll = 0;
  let all = 0;
  for (let i = 0; i < data.length; i += 4 * step) {
    const cr = data[i];
    const cg = data[i + 1];
    const cb = data[i + 2];
    const ca = data[i + 3];
    if (ca < 125) continue;
    rAll += cr;
    gAll += cg;
    bAll += cb;
    all++;
    const max = Math.max(cr, cg, cb);
    const min = Math.min(cr, cg, cb);
    if (max > 245 && min > 245) continue; // near-white
    if (max < 12) continue; // near-black
    r += cr;
    g += cg;
    b += cb;
    count++;
  }
  if (count > 0)
    return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
  if (all > 0)
    return { r: Math.round(rAll / all), g: Math.round(gAll / all), b: Math.round(bAll / all) };
  return { r: 80, g: 80, b: 80 };
}

/** Darken a colour toward black by `factor` (0 = unchanged, 1 = black). Used to
 * keep the header gradient legible against light artwork. */
export function darken({ r, g, b }: Rgb, factor: number): Rgb {
  const k = 1 - factor;
  return { r: Math.round(r * k), g: Math.round(g * k), b: Math.round(b * k) };
}

/** `rgb(r, g, b)` string for use in CSS. */
export function rgbCss({ r, g, b }: Rgb): string {
  return `rgb(${r}, ${g}, ${b})`;
}
