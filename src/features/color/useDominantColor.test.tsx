import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDominantColor } from './useDominantColor';

/** A fake Image whose `src` setter synchronously invokes onload. */
class FakeImage {
  crossOrigin = '';
  onload: (() => void) | null = null;
  set src(_v: string) {
    if (this.onload) this.onload();
  }
}

function stubCanvas(data: number[]) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
    getImageData: () => ({ data: new Uint8ClampedArray(data) }),
  } as unknown as CanvasRenderingContext2D);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useDominantColor', () => {
  it('returns null when there is no src', () => {
    const { result } = renderHook(() => useDominantColor(null));
    expect(result.current).toBeNull();
  });

  it('samples the image and returns a darkened rgb() string', async () => {
    vi.stubGlobal('Image', FakeImage);
    stubCanvas([200, 100, 40, 255]); // one opaque mid-tone pixel
    const { result } = renderHook(() => useDominantColor('http://x/img.jpg'));
    // 200,100,40 darkened by 0.25 → 150,75,30
    await waitFor(() => expect(result.current).toBe('rgb(150, 75, 30)'));
    vi.unstubAllGlobals();
  });
});
