/**
 * Convert a Blob to a base64 string (no `data:...;base64,` prefix) — the form
 * Capacitor Filesystem's writeFile expects for binary data, since the native
 * bridge can't carry a Blob. Uses FileReader (available in the WKWebView).
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.onload = () => {
      const result = String(reader.result);
      // Strip the "data:<mime>;base64," prefix FileReader prepends.
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}
