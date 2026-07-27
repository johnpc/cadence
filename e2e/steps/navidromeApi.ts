/**
 * Minimal Subsonic/Navidrome REST helper for e2e setup/teardown — lets a
 * scenario create fixtures (e.g. a second user's public playlist) directly
 * against the server, instead of driving fragile UI. Uses the SAME server URL
 * the app build points at (VITE_NAVIDROME_URL). Kept out of the app bundle
 * (e2e-only).
 *
 * Subsonic auth is a stateless per-request salt+token pair (verified fresh
 * server-side every call, no server-side session) — unlike Jellyfin, there's
 * no per-(user, DeviceId) session to collide on, so concurrent CI matrix
 * shards fixturing as the same user need no DeviceId scoping.
 */
const BASE = (process.env.VITE_NAVIDROME_URL ?? '').replace(/\/+$/, '');

export interface Session {
  username: string;
  subsonicSalt: string;
  subsonicToken: string;
}

function authParams(s?: Session): URLSearchParams {
  const params = new URLSearchParams({ v: '1.16.1', c: 'cadence-e2e', f: 'json' });
  if (s) {
    params.set('u', s.username);
    params.set('t', s.subsonicToken);
    params.set('s', s.subsonicSalt);
  }
  return params;
}

async function rest<T>(
  path: string,
  session: Session | undefined,
  extra: Record<string, string | string[]> = {},
): Promise<T> {
  const params = authParams(session);
  for (const [key, value] of Object.entries(extra)) {
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else params.set(key, value);
  }
  const res = await fetch(`${BASE}/rest${path}?${params.toString()}`);
  if (!res.ok) throw new Error(`Navidrome GET ${path} → ${res.status}`);
  const body = (await res.json()) as {
    'subsonic-response': { status: string; error?: { code: number; message: string } };
  };
  const envelope = body['subsonic-response'];
  if (envelope.status === 'failed') {
    throw new Error(`Navidrome ${path} failed: ${envelope.error?.message ?? envelope.error?.code}`);
  }
  return envelope as T;
}

/** Authenticate a user by name/password via Navidrome's native login (the
 * only call not Subsonic-namespaced) → the salt+token pair every other call
 * needs. */
export async function login(username: string, password: string): Promise<Session> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(`Navidrome login → ${res.status}`);
  const body = (await res.json()) as { subsonicSalt: string; subsonicToken: string };
  return { username, subsonicSalt: body.subsonicSalt, subsonicToken: body.subsonicToken };
}

/** A handful of real audio track ids from the library (for seeding fixtures). */
export async function someTrackIds(s: Session, limit: number): Promise<string[]> {
  const r = await rest<{ randomSongs: { song?: { id: string }[] } }>('/getRandomSongs', s, {
    size: String(limit),
  });
  return (r.randomSongs.song ?? []).map((t) => t.id);
}

/** Create a playlist owned by `s` seeded with `songIds`, then set its
 * visibility (createPlaylist has no public/private flag of its own). Returns
 * its id. */
export async function createPlaylist(
  s: Session,
  name: string,
  isPublic: boolean,
  songIds: string[] = [],
): Promise<string> {
  const r = await rest<{ playlist: { id: string } }>('/createPlaylist', s, {
    name,
    songId: songIds,
  });
  await setPlaylistPublic(s, r.playlist.id, isPublic);
  return r.playlist.id;
}

/** Create a small owned (private) playlist seeded with `count` real tracks;
 * returns its id. A tiny fixture so "download the whole playlist" completes
 * fast + fully. */
export async function createSmallPlaylist(
  s: Session,
  name: string,
  count: number,
): Promise<string> {
  const ids = await someTrackIds(s, count);
  return createPlaylist(s, name, false, ids);
}

/** Flip a playlist public/private (owner session). */
export async function setPlaylistPublic(s: Session, id: string, isPublic: boolean): Promise<void> {
  await rest('/updatePlaylist', s, { playlistId: id, public: String(isPublic) });
}

/** Delete a playlist (owner session) — teardown. */
export async function deletePlaylist(s: Session, id: string): Promise<void> {
  await rest('/deletePlaylist', s, { id });
}

/** Delete ALL of `s`'s own playlists with the given exact name — sweeps stale
 * fixtures a crashed run may have orphaned. Best-effort per item. */
export async function deletePlaylistsByName(s: Session, name: string): Promise<void> {
  const r = await rest<{
    playlists: { playlist?: { id: string; name: string; owner: string }[] };
  }>('/getPlaylists', s);
  const mine = (r.playlists.playlist ?? []).filter(
    (p) => p.name === name && p.owner === s.username,
  );
  await Promise.all(mine.map((p) => deletePlaylist(s, p.id).catch(() => undefined)));
}
