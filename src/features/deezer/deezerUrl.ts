/** Pure helpers for the Deezer playlist reference the user pastes. The server
 * (plugin) does the authoritative parse, but validating here lets us disable the
 * Import button and show inline guidance before a doomed round-trip. */

/** Extract the numeric playlist id from a Deezer URL or a bare id. Accepts:
 *  - https://www.deezer.com/playlist/908622995
 *  - https://www.deezer.com/en/playlist/908622995?utm=...
 *  - deezer.com/playlist/908622995
 *  - 908622995
 * Returns null when no playlist id is present. */
export function parseDeezerPlaylistId(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  if (/^\d+$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/playlist\/(\d+)/i);
  return match ? match[1] : null;
}

/** True when the pasted text references a Deezer playlist we can try to import. */
export function isValidDeezerPlaylist(raw: string): boolean {
  return parseDeezerPlaylistId(raw) !== null;
}
