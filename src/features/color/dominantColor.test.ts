import { describe, expect, it } from 'vitest';
import { averageColor, darken, rgbCss } from './dominantColor';

/** Build an RGBA byte array from [r,g,b,a] tuples. */
function pixels(...px: [number, number, number, number][]): Uint8ClampedArray {
  return new Uint8ClampedArray(px.flat());
}

describe('averageColor', () => {
  it('averages opaque mid-tone pixels', () => {
    const data = pixels([100, 50, 200, 255], [200, 150, 0, 255]);
    expect(averageColor(data, 1)).toEqual({ r: 150, g: 100, b: 100 });
  });

  it('skips transparent pixels', () => {
    const data = pixels([255, 0, 0, 0], [40, 60, 80, 255]);
    expect(averageColor(data, 1)).toEqual({ r: 40, g: 60, b: 80 });
  });

  it('ignores near-white and near-black, keeping the real hue', () => {
    const data = pixels([255, 255, 255, 255], [0, 0, 0, 255], [120, 30, 90, 255]);
    expect(averageColor(data, 1)).toEqual({ r: 120, g: 30, b: 90 });
  });

  it('falls back to a plain mean when every pixel is filtered', () => {
    // Two pure-white + one pure-black: none qualify, so use the overall mean.
    const data = pixels([255, 255, 255, 255], [0, 0, 0, 255]);
    const avg = averageColor(data, 1);
    expect(avg).toEqual({ r: 128, g: 128, b: 128 });
  });

  it('returns a neutral grey when there are no opaque pixels', () => {
    expect(averageColor(pixels([10, 10, 10, 0]), 1)).toEqual({ r: 80, g: 80, b: 80 });
  });
});

describe('darken', () => {
  it('scales each channel toward black', () => {
    expect(darken({ r: 200, g: 100, b: 40 }, 0.5)).toEqual({ r: 100, g: 50, b: 20 });
  });

  it('leaves the colour unchanged at factor 0', () => {
    expect(darken({ r: 12, g: 34, b: 56 }, 0)).toEqual({ r: 12, g: 34, b: 56 });
  });
});

describe('rgbCss', () => {
  it('formats a CSS rgb() string', () => {
    expect(rgbCss({ r: 1, g: 2, b: 3 })).toBe('rgb(1, 2, 3)');
  });
});
