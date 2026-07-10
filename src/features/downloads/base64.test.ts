import { describe, expect, it } from 'vitest';
import { blobToBase64 } from './base64';

describe('blobToBase64', () => {
  it('encodes a blob to bare base64 (no data-URL prefix)', async () => {
    const b64 = await blobToBase64(new Blob(['hello']));
    expect(b64).toBe(btoa('hello'));
    expect(b64).not.toContain(',');
    expect(b64).not.toContain('data:');
  });

  it('round-trips binary-ish content', async () => {
    const text = 'audio-bytes-';
    const b64 = await blobToBase64(new Blob([text]));
    // atob→bytes back to the original UTF-8 string.
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    expect(new TextDecoder().decode(bytes)).toBe(text);
  });
});
