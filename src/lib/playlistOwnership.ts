/**
 * Who owns which playlist, remembered per user. Jellyfin's playlist list has no
 * owner field, so ownership is proven one playlist at a time via the owner-only
 * `/Playlists/{id}/Users` (200 for the owner, 403 for everyone else — admins
 * included). That fan-out used to run on every list fetch, TWICE per Home load
 * (Your Library's and the community shelf's queries each probed every playlist
 * on the server). A playlist's owner never changes, so:
 *  - a DEFINITE answer (200 → mine, 403 → not mine) is remembered on disk, per
 *    user id, and never asked again;
 *  - concurrent asks for the same playlist share one request;
 *  - an indefinite answer (timeout, offline, 5xx) reads as "not mine" for now
 *    but is NOT remembered, so it is retried next time;
 *  - playlists this user creates are recorded as theirs at once.
 */
import { request } from './jellyfinFetch';
import { HttpError } from './jellyfinErrors';
import { getSession } from './sessionStore';

const KEY_PREFIX = 'cadence.playlist-ownership.';

type Known = Record<string, boolean>;

let loadedFor: string | null = null;
let known: Known = {};
const inflight = new Map<string, Promise<boolean>>();

const storageKey = (userId: string) => `${KEY_PREFIX}${userId}`;

/** The current user's remembered answers (loaded once per user). */
function knownFor(userId: string): Known {
  if (loadedFor !== userId) {
    loadedFor = userId;
    inflight.clear();
    try {
      const raw = localStorage.getItem(storageKey(userId));
      const parsed: unknown = raw ? JSON.parse(raw) : {};
      known = parsed && typeof parsed === 'object' ? (parsed as Known) : {};
    } catch {
      known = {};
    }
  }
  return known;
}

function remember(userId: string, id: string, owned: boolean): void {
  knownFor(userId)[id] = owned;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(known));
  } catch {
    /* storage full / unavailable: the in-memory answer still holds this run */
  }
}

/** Ask the server once. 200 → mine, 403 → not mine (both remembered); anything
 * else → "not mine" for now, asked again next time. */
function probe(userId: string, id: string): Promise<boolean> {
  const running = inflight.get(id);
  if (running) return running;
  const job = request(`/Playlists/${id}/Users`)
    .then(() => {
      remember(userId, id, true);
      return true;
    })
    .catch((err: unknown) => {
      if (err instanceof HttpError && err.status === 403) remember(userId, id, false);
      return false;
    })
    .finally(() => inflight.delete(id));
  inflight.set(id, job);
  return job;
}

/** Whether the current user owns playlist `id` (remembered, deduped). */
export function isPlaylistOwner(id: string): Promise<boolean> {
  const userId = getSession()?.userId ?? '';
  const answer = knownFor(userId)[id];
  if (answer !== undefined) return Promise.resolve(answer);
  return probe(userId, id);
}

/** Record a playlist the current user just created (no probe needed). */
export function rememberOwnPlaylist(id: string): void {
  const userId = getSession()?.userId ?? '';
  if (userId && id) remember(userId, id, true);
}

/** Test-only: forget everything in memory (disk is cleared by the test). */
export function __resetPlaylistOwnership(): void {
  loadedFor = null;
  known = {};
  inflight.clear();
}
