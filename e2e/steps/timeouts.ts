/**
 * Shared e2e wait budgets. Data reads go through a cloudflared tunnel to one
 * shared Jellyfin server that can be slow/cold under CI load — so waits on
 * server-backed content need real headroom. Centralised here (not hardcoded per
 * step) so the whole suite tunes in one place.
 *
 * DATA_WAIT: for anything backed by a Jellyfin round-trip (shelves, tracks,
 * search results, favorite toggles). Generous in CI where the tunnel is
 * cold-prone; tighter locally for fast feedback.
 */
export const DATA_WAIT = process.env.CI ? 45_000 : 15_000;

/**
 * DOWNLOAD_WAIT: for operations that transfer whole audio FILES, not just a JSON
 * round-trip — downloading a track's bytes to the offline cache and then
 * resolving/playing that cached blob. Byte transfer over the shared tunnel is
 * materially slower and more variable than a metadata read, so these get a
 * larger budget than DATA_WAIT (which was occasionally too tight for a real
 * download to finish, the one intermittent downloads-area failure).
 */
export const DOWNLOAD_WAIT = process.env.CI ? 90_000 : 30_000;
