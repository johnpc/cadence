import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWithProgress } from './fetchWithProgress';

afterEach(() => {
  vi.unstubAllGlobals();
});

/** A Response whose body streams `chunks` (Uint8Arrays) one read at a time, with
 * the given Content-Length. Lets us assert on incremental progress. */
function streamingResponse(chunks: Uint8Array[], total: number): Response {
  let i = 0;
  const body = {
    getReader: () => ({
      read: () =>
        i < chunks.length
          ? Promise.resolve({ done: false, value: chunks[i++] })
          : Promise.resolve({ done: true, value: undefined }),
    }),
  };
  return {
    ok: true,
    status: 200,
    body,
    headers: new Headers({ 'Content-Length': String(total), 'Content-Type': 'audio/mpeg' }),
  } as unknown as Response;
}

describe('fetchWithProgress', () => {
  it('reports incremental progress from Content-Length, then 1', async () => {
    const chunks = [new Uint8Array(4), new Uint8Array(4), new Uint8Array(2)];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(streamingResponse(chunks, 10)));
    const seen: number[] = [];
    const blob = await fetchWithProgress('u', (f) => seen.push(f));
    expect(seen).toEqual([0.4, 0.8, 1, 1]);
    expect(blob.size).toBe(10);
  });

  it('falls back to blob() and reports a single 1 when size is unknown', async () => {
    const res = {
      ok: true,
      status: 200,
      body: null,
      headers: new Headers(),
      blob: vi.fn().mockResolvedValue(new Blob(['xyz'])),
    } as unknown as Response;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res));
    const seen: number[] = [];
    const blob = await fetchWithProgress('u', (f) => seen.push(f));
    expect(seen).toEqual([1]);
    expect(blob.size).toBe(3);
  });

  it('throws on a non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500 } as unknown as Response),
    );
    await expect(fetchWithProgress('u', () => {})).rejects.toThrow(/500/);
  });
});
