/**
 * Minimal Jellyfin REST helper for e2e setup/teardown — lets a scenario create
 * fixtures (e.g. a second user's public playlist) directly against the server,
 * instead of driving fragile UI. Uses the SAME server URL the app build points
 * at (VITE_JELLYFIN_URL). Kept out of the app bundle (e2e-only).
 */
const BASE = (process.env.VITE_JELLYFIN_URL ?? '').replace(/\/+$/, '');

// A DISTINCT fixture DeviceId per acceptance area. Jellyfin evicts prior sessions
// that share a (user, DeviceId), so when several areas set up fixtures as the
// SAME cadence-test user CONCURRENTLY with a shared DeviceId, whichever logged in
// first has its token invalidated → 401 on the next fixture call (even a GET).
// Scoping the DeviceId per area (E2E_DEVICE_ID, set per matrix job in ci.yml)
// keeps each area's fixture session independent. Falls back to a unique-ish id
// locally so parallel local runs don't collide either.
const API_DEVICE_ID = `cadence-e2e-api-${process.env.E2E_DEVICE_ID ?? 'local'}`;

function authHeader(token?: string): string {
  const core = `MediaBrowser Client="cadence-e2e", Device="e2e", DeviceId="${API_DEVICE_ID}", Version="1"`;
  return token ? `${core}, Token="${token}"` : core;
}

async function api<T>(
  path: string,
  opts: { method?: string; token?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      // Jellyfin 12 removed X-Emby-Authorization (400 when it's the only auth
      // header); the full MediaBrowser header must ride in `Authorization`.
      // Mirror the app's jellyfinFetch: send both, same value.
      Authorization: authHeader(opts.token),
      'X-Emby-Authorization': authHeader(opts.token),
      ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) throw new Error(`Jellyfin ${opts.method ?? 'GET'} ${path} → ${res.status}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export interface Session {
  token: string;
  userId: string;
}

/** Authenticate a user by name/password → {token, userId}. */
export async function login(username: string, password: string): Promise<Session> {
  const r = await api<{ AccessToken: string; User: { Id: string } }>('/Users/AuthenticateByName', {
    method: 'POST',
    body: { Username: username, Pw: password },
  });
  return { token: r.AccessToken, userId: r.User.Id };
}

/** Revoke a session's token server-side so it doesn't linger. Best-effort —
 * teardown must never fail a scenario, and a token may already be gone. */
export async function logout(token: string): Promise<void> {
  await api('/Sessions/Logout', { method: 'POST', token }).catch(() => undefined);
}

/** Create a playlist owned by `s`, public or private, and return its id. */
export async function createPlaylist(
  s: Session,
  name: string,
  isPublic: boolean,
  ids: string[] = [],
): Promise<string> {
  const r = await api<{ Id: string }>('/Playlists', {
    method: 'POST',
    token: s.token,
    body: { Name: name, UserId: s.userId, MediaType: 'Audio', IsPublic: isPublic, Ids: ids },
  });
  return r.Id;
}

/** A handful of real audio track ids from the library (for seeding fixtures). */
export async function someTrackIds(s: Session, limit: number): Promise<string[]> {
  const r = await api<{ Items: { Id: string }[] }>(
    `/Items?IncludeItemTypes=Audio&Recursive=true&Limit=${limit}&userId=${s.userId}`,
    { token: s.token },
  );
  return r.Items.map((t) => t.Id);
}

/** Create a small owned playlist seeded with `count` real tracks; returns its
 * id. A tiny fixture so "download the whole playlist" completes fast + fully. */
export async function createSmallPlaylist(
  s: Session,
  name: string,
  count: number,
): Promise<string> {
  const ids = await someTrackIds(s, count);
  const r = await api<{ Id: string }>('/Playlists', {
    method: 'POST',
    token: s.token,
    body: { Name: name, UserId: s.userId, MediaType: 'Audio', IsPublic: false, Ids: ids },
  });
  return r.Id;
}

/** Flip a playlist public/private (owner session). */
export async function setPlaylistPublic(s: Session, id: string, isPublic: boolean): Promise<void> {
  await api(`/Playlists/${id}`, { method: 'POST', token: s.token, body: { IsPublic: isPublic } });
}

/** Delete a playlist (owner session) — teardown. */
export async function deletePlaylist(s: Session, id: string): Promise<void> {
  await api(`/Items/${id}`, { method: 'DELETE', token: s.token });
}

/** Delete ALL of the user's playlists with the given exact name — sweeps stale
 * fixtures a crashed run may have orphaned. Best-effort per item. */
export async function deletePlaylistsByName(s: Session, name: string): Promise<void> {
  const r = await api<{ Items: { Id: string; Name: string }[] }>(
    `/Items?IncludeItemTypes=Playlist&Recursive=true&userId=${s.userId}`,
    { token: s.token },
  );
  const mine = r.Items.filter((p) => p.Name === name);
  await Promise.all(mine.map((p) => deletePlaylist(s, p.Id).catch(() => undefined)));
}

/** The user's saved resume position (seconds) for an item, read live. */
export async function savedPositionSeconds(s: Session, itemId: string): Promise<number> {
  const r = await api<{ UserData?: { PlaybackPositionTicks?: number } }>(
    `/Users/${s.userId}/Items/${itemId}`,
    { token: s.token },
  );
  return (r.UserData?.PlaybackPositionTicks ?? 0) / 10_000_000;
}

/** The id of the fixture album named exactly `name`. */
export async function albumIdByName(s: Session, name: string): Promise<string> {
  const q = new URLSearchParams({
    IncludeItemTypes: 'MusicAlbum',
    Recursive: 'true',
    SearchTerm: name,
    userId: s.userId,
  });
  const r = await api<{ Items: { Id: string; Name: string }[] }>(`/Items?${q}`, { token: s.token });
  const album = r.Items.find((i) => i.Name === name);
  if (!album) throw new Error(`fixture album "${name}" not found`);
  return album.Id;
}

/** Names of the tracks in album `albumId` the user has liked. */
export async function likedTrackNames(s: Session, albumId: string): Promise<string[]> {
  const q = new URLSearchParams({
    ParentId: albumId,
    IncludeItemTypes: 'Audio',
    Recursive: 'true',
    Filters: 'IsFavorite',
    userId: s.userId,
  });
  const r = await api<{ Items: { Name: string }[] }>(`/Items?${q}`, { token: s.token });
  return r.Items.map((i) => i.Name);
}

/** Un-like every track in album `albumId` (scenario teardown). */
export async function unlikeAlbumTracks(s: Session, albumId: string): Promise<void> {
  const q = new URLSearchParams({
    ParentId: albumId,
    IncludeItemTypes: 'Audio',
    Recursive: 'true',
    Filters: 'IsFavorite',
    userId: s.userId,
  });
  const r = await api<{ Items: { Id: string }[] }>(`/Items?${q}`, { token: s.token });
  for (const i of r.Items)
    await api(`/Users/${s.userId}/FavoriteItems/${i.Id}`, { method: 'DELETE', token: s.token });
}

/** The parts of a fixture audiobook (by its Album/book title), in play order,
 * with their durations in seconds — what a fake Storyteller bridge needs to
 * line its timeline up with the real audio. */
export async function audiobookParts(
  s: Session,
  bookTitle: string,
): Promise<{ ItemId: string; Duration: number }[]> {
  const params = new URLSearchParams({
    IncludeItemTypes: 'AudioBook',
    Recursive: 'true',
    Fields: 'RunTimeTicks,Album,IndexNumber',
    userId: s.userId,
  });
  const r = await api<{
    Items: {
      Id: string;
      Album?: string;
      Name: string;
      IndexNumber?: number;
      RunTimeTicks?: number;
    }[];
  }>(`/Items?${params.toString()}`, { token: s.token });
  return r.Items.filter((i) => (i.Album ?? i.Name) === bookTitle)
    .sort((a, b) => (a.IndexNumber ?? 0) - (b.IndexNumber ?? 0))
    .map((i) => ({ ItemId: i.Id, Duration: (i.RunTimeTicks ?? 0) / 10_000_000 }));
}

/** The book-page id of the fixture audiobook titled `title`: the first part (by
 * part number) of that book, which is how the app groups a multi-part book. */
export async function bookGroupId(s: Session, title: string): Promise<string> {
  const q = new URLSearchParams({
    IncludeItemTypes: 'AudioBook',
    Recursive: 'true',
    SearchTerm: title,
    Fields: 'Album',
  });
  const r = await api<{
    Items: { Id: string; Name: string; Album?: string; IndexNumber?: number }[];
  }>(`/Users/${s.userId}/Items?${q.toString()}`, { token: s.token });
  const parts = r.Items.filter((i) => (i.Album ?? i.Name) === title).sort(
    (a, b) => (a.IndexNumber ?? 0) - (b.IndexNumber ?? 0),
  );
  if (!parts[0]) throw new Error(`fixture audiobook "${title}" not found`);
  return parts[0].Id;
}
