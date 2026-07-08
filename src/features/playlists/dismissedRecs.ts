const KEY = 'cadence.dismissed-recs';

type DismissedMap = Record<string, string[]>;

function read(): DismissedMap {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as DismissedMap) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Track ids the user has dismissed as recommendations for a given playlist, so
 * they never resurface. Persisted per-playlist in localStorage. */
export function getDismissedRecs(playlistId: string): string[] {
  return read()[playlistId] ?? [];
}

/** Record that `trackId` was dismissed for `playlistId`. */
export function dismissRec(playlistId: string, trackId: string): void {
  if (!playlistId || !trackId) return;
  try {
    const map = read();
    const ids = new Set(map[playlistId] ?? []);
    ids.add(trackId);
    map[playlistId] = [...ids];
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* storage full / unavailable — dismissal just won't persist */
  }
}
