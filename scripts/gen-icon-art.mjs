#!/usr/bin/env node
/**
 * Render the Cadence brand mark — the "record C": a heavy vinyl disc with a
 * wedge cut on the right so the disc itself reads as a fat letter C, plus the
 * centre label dot — into the two source icons:
 *   assets/icon.png       — light: near-black mark on a full-bleed brand-green field
 *   assets/icon-dark.png  — dark:  brand-green mark on a near-black field
 *
 * Vector-exact (the concept came from image-gen; this redraws it with clean
 * geometry). 1024x1024, sRGB, no alpha (App Store rejects alpha). The mark spans
 * ~57% of the canvas so Android adaptive / PWA maskable crops never clip it.
 *
 * Then fan out every platform icon:  node scripts/gen-app-icons.mjs --native
 */
import sharp from 'sharp';
import { join } from 'node:path';

export const GREEN = '#1db954'; // --cad-accent
export const INK = '#121212'; // near-black canvas (manifest theme_color)

const S = 1024;
const C = S / 2;
const X = C + 20; // optical centring: the open mouth makes the C read left-heavy
const R = 292; // disc radius
const HOLE = 124; // white ring around the label
const DOT = 60; // centre label
const WEDGE = 34; // half-angle of the C's mouth, degrees

const pt = (deg, r) => {
  const a = (deg * Math.PI) / 180;
  return `${(X + r * Math.cos(a)).toFixed(2)} ${(C - r * Math.sin(a)).toFixed(2)}`;
};

/** Disc minus the right-hand wedge, then the label hole (field colour), then the dot. */
function markSvg(fg, bg) {
  const disc = `M ${X} ${C} L ${pt(WEDGE, R)} A ${R} ${R} 0 1 0 ${pt(-WEDGE, R)} Z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <rect width="${S}" height="${S}" fill="${bg}"/>
  <path d="${disc}" fill="${fg}"/>
  <circle cx="${X}" cy="${C}" r="${HOLE}" fill="${bg}"/>
  <circle cx="${X}" cy="${C}" r="${DOT}" fill="${fg}"/>
</svg>`;
}

const render = (fg, bg, file) =>
  sharp(Buffer.from(markSvg(fg, bg)))
    .flatten({ background: bg })
    .removeAlpha()
    .toColourspace('srgb')
    .png()
    .toFile(join(process.cwd(), file));

await render(INK, GREEN, 'assets/icon.png');
await render(GREEN, INK, 'assets/icon-dark.png');
console.log('✓ assets/icon.png (light) + assets/icon-dark.png (dark)');
