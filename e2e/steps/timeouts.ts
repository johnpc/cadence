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
