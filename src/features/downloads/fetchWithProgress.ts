/**
 * Fetch a URL to a Blob while reporting download progress (0..1). Reads the
 * response body as a stream and calls `onProgress` as chunks arrive, using the
 * Content-Length header for the denominator. When the length is unknown (no
 * header) or the body isn't streamable, it falls back to a plain `.blob()` and
 * reports a single 1 on completion — the download still works, just without a
 * live percentage. Throws on a non-ok response so the caller can retry/fail.
 */
export async function fetchWithProgress(
  url: string,
  onProgress: (fraction: number) => void,
): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: ${res.status}`);

  const total = Number(res.headers.get('Content-Length') ?? 0);
  const body = res.body;
  // No streamable body or unknown size → can't compute %, so just resolve the
  // blob and report complete.
  if (!body || !total) {
    const blob = await res.blob();
    onProgress(1);
    return blob;
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.length;
      onProgress(received / total);
    }
  }
  onProgress(1);
  return new Blob(chunks as BlobPart[], { type: res.headers.get('Content-Type') ?? '' });
}
