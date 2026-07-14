<p align="center">
  <img src="assets/banner.png" alt="Cadence — your Jellyfin library, like Spotify" width="100%" />
</p>

<p align="center">
  <a href="https://github.com/johnpc/cadence/actions/workflows/ci.yml"><img src="https://github.com/johnpc/cadence/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT" />
</p>

# Cadence

**A Spotify-like music client for your self-hosted Jellyfin server.** Your whole library isn't a
giant scroll list — you discover through **recommendations, search, and playlists**, and build your
own world by adding songs to your **library, playlists, and liked songs**.

Log in with your Jellyfin account and everything is yours: your liked songs, your playlists, your
recommendations — all backed by the Jellyfin server you already run.

## Features

| Feature                                       | Status |
| --------------------------------------------- | ------ |
| Spotify-style shell (Home / Search / Library) | ✅     |
| Light / Dark / System theme                   | ✅     |
| Log in with your Jellyfin account             | ✅     |
| Playback + persistent Now-Playing bar         | ✅     |
| Search (the primary discovery surface)        | ✅     |
| Liked songs                                   | ✅     |
| Playlists (browse, create, add)               | ✅     |
| Home recommendations (recently added, radio)  | ✅     |
| Native iOS (background audio, lock-screen)    | ✅     |
| Fuzzy search via Meilisearch                  | ⬜     |

## The vision

Spotify's magic isn't the size of the catalog — it's that you never see the catalog. You see **a few
things worth playing right now**: recommendations tuned to you, a fast search box, and the playlists
and songs you've saved. Cadence brings that shape to the music you already own on Jellyfin.

## Architecture

Cadence is a **static PWA** (Ionic 8 + React 19 + TypeScript, built with Vite, wrapped with
Capacitor for iOS). It has **no backend of its own** — your Jellyfin server _is_ the backend:

- **Jellyfin** handles auth, the library, liked songs (favorites), playlists, streaming, and
  recommendations/radio (instant mixes) — all natively, all per-user.
- The browser talks to Jellyfin **directly** (CORS-enabled), so there's no proxy in the hot path.
- **Search** starts on Jellyfin's native search and later upgrades to **Meilisearch** (via the
  self-hosted `marlin-search` indexer) for fuzzy, typo-tolerant results.

### Where the data comes from

Everything you see is **your Jellyfin server's real data**, read live over its HTTP API. Cadence
stores nothing of its own except your session token and your theme choice (on-device). Liking a song
or creating a playlist writes straight to Jellyfin — so it shows up in every other Jellyfin client
too.

## Self-hosting

Cadence works with **any** Jellyfin server — run it yourself in one command:

```bash
docker run -d -p 8095:80 mrorbitman/cadence:latest
# or, with the compose file in this repo:
docker compose up -d
```

Open **http://localhost:8095**, and on the sign-in screen enter your **Jellyfin server address**
(e.g. `https://jellyfin.example.com`) along with your Jellyfin username and password. The server
address is remembered on that device — the image itself is server-agnostic, so nothing about your
setup is baked in.

### Optional runtime settings

Both are read at **container start** (not baked into the image) — set or change them per deployment
without rebuilding:

- **`JELLYFIN_URL`** — pre-fills the sign-in **Server** field with your Jellyfin URL, so users don't
  have to type it. They can still override it, and a saved choice on the device wins.
- **`SIGNUP_URL`** — shows a _Sign up_ link on the sign-in screen pointing at your own
  registration/invite page.

```bash
docker run -d -p 8095:80 \
  -e JELLYFIN_URL=https://jellyfin.example.com \
  -e SIGNUP_URL=https://your-server.example/signup \
  mrorbitman/cadence:latest
```

Unset → the field is empty / no link.

### Optional plugins & sidecars (better search & recommendations)

Cadence works great against a stock Jellyfin, but a few **optional** server-side add-ons make it
faster and higher-quality. All are opt-in — Cadence detects/uses them when present and falls back
cleanly when they're not.

| Add-on                                                                                | What you get                                                                                                                                                                                                              | Without it                                                                                                                                             |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **[CadenceConfig plugin](https://github.com/johnpc/jellyfin-plugin-cadence-config)**  | Configure Cadence once, in the Jellyfin dashboard, for **every** user (web + native iOS): search/sign-up/cast URLs are pushed to clients at sign-in, and "request music" is proxied with the Lidarr key kept server-side. | Each user configures URLs by hand in Settings; "request music" + the search URL only work on the web build (native iOS has no nginx to inject config). |
| **[marlin-search](https://github.com/fredrikburmester/marlin-search)** (Meilisearch)  | Search answers in **one** fast, well-ranked request, scoped to music.                                                                                                                                                     | Jellyfin's native search — several requests per query, weaker substring ranking.                                                                       |
| **[CrowdMix plugin](https://github.com/johnpc/jellyfin-plugin-crowdmix)**             | Instant Mix / radio uses real listening-crowd similarity (Last.fm), re-ranked against your library — close to Spotify's "magic."                                                                                          | Jellyfin's native Instant Mix (audio/metadata heuristics), which feels more random.                                                                    |
| **[popular-tracks plugin](https://github.com/johnpc/jellyfin-plugin-popular-tracks)** | An artist's **Popular** row is ordered by real Last.fm popularity (e.g. Radiohead → _Creep_ first).                                                                                                                       | Ordered by local `PlayCount` — ~0 on a server nobody scrobbles, so effectively random.                                                                 |

Details for each below. The **CadenceConfig plugin is the recommended starting point** — it's the
only add-on that makes the others work on the native iOS app, and it removes all per-device setup.

- **One-stop client config + native support — [jellyfin-plugin-cadence-config](https://github.com/johnpc/jellyfin-plugin-cadence-config).**
  A Jellyfin plugin that hands every Cadence client (web PWA **and** native iOS) its runtime config at
  sign-in: the marlin search URL, sign-up URL, cast receiver id, and whether the Lidarr "request music"
  proxy is available. It also proxies the request calls to Lidarr, **injecting the API key server-side**
  so the write-capable credential never reaches a client. Configure it once in **Dashboard → Plugins →
  CadenceConfig**; every user is auto-configured and no one touches Settings. When it sets a value, the
  matching Settings field becomes read-only ("Set by the server administrator"). This is what makes
  marlin search and requesting music work on the native app at all — native has no nginx to write the
  runtime `config.js`. Install by adding the repo `https://raw.githubusercontent.com/johnpc/jellyfin-plugin-cadence-config/main/manifest.json`
  to Jellyfin's plugin repositories.

- **Faster search — [Meilisearch](https://www.meilisearch.com/) via
  [marlin-search](https://github.com/fredrikburmester/marlin-search).** Jellyfin's native search fans
  out into several requests per query; a marlin-search indexer answers in **one**, with much better
  ranking. Run marlin against your Jellyfin, then in Cadence go to **Settings → Faster search** and
  enter the indexer's **URL + token** (stored on your device — never in the build). Cadence scopes it
  to music and falls back to native search if the indexer is unreachable or an index isn't built yet.
  A per-deploy default URL can also be set at build time via `VITE_MARLIN_URL` (the token still comes
  from Settings).
  - **Recommended for self-hosters — the same-origin proxy (no token in the browser, no public
    indexer).** Instead of exposing marlin and entering a token per device, set `MARLIN_URL` +
    `MARLIN_TOKEN` on the Cadence container (see `deploy/compose.yaml`). The serving nginx then proxies
    same-origin `/api/search` to the indexer and **injects the token server-side**, so the browser
    sends no token and marlin needs no public hostname (it's reached over the LAN from the container).
    Cadence auto-detects this (`marlinProxy`) and uses it with no per-device setup.
- **Better radio / Instant Mix — [jellyfin-plugin-crowdmix](https://github.com/johnpc/jellyfin-plugin-crowdmix).**
  Jellyfin's native Instant Mix (which Cadence uses for "start radio" and endless play) leans on
  audio/metadata heuristics and can feel random. CrowdMix replaces it with real **listening-crowd
  similarity** from Last.fm ("people who played X also played Y"), re-ranked against tracks you own
  and your play history — close to Spotify's radio "magic." **No Cadence setting needed** — install +
  configure the plugin (Last.fm API key) on Jellyfin; it falls back to the native mix for obscure
  seeds so radio never comes up empty.
- **Real "Popular" tracks — [jellyfin-plugin-popular-tracks](https://github.com/johnpc/jellyfin-plugin-popular-tracks).**
  On a self-hosted server nobody scrobbles, so Jellyfin's `PlayCount` is ~0 and an artist's **Popular**
  row is effectively random. This plugin transparently re-orders that one query by real **Last.fm**
  popularity. **No Cadence setting needed** — install + configure the plugin (Last.fm API key) on
  Jellyfin and the artist Popular row just gets the right order (e.g. Radiohead → _Creep_ first).

> Planned/under consideration for further speedups: a caching or aggregation sidecar in front of
> Jellyfin (individual Jellyfin reads over a remote tunnel are the main latency floor) — e.g. a plugin
> exposing page-shaped/aggregated endpoints, or an edge cache for cover art and instant-mix radio.

Notes:

- The image is multi-arch (`linux/amd64` + `linux/arm64`), so it runs on x86 boxes, a Raspberry Pi,
  or an ARM NAS.
- The browser talks to your Jellyfin server **directly**. For remote access, put Cadence behind your
  own HTTPS reverse proxy (Caddy, nginx, Traefik, cloudflared…), and make sure your Jellyfin server
  is reachable from the browser and sends permissive CORS headers.
- Installable as a PWA from the browser once loaded.

## Develop

```bash
npm install
npm run dev            # Vite dev server on :5173
npm run quality        # full gate: lint + format + lines + features + coverage + crap + build
npm run test:e2e       # Gherkin acceptance tests (Playwright + playwright-bdd)
npm run gen:icons      # regenerate app icons from assets/icon*.png
```

The Jellyfin base URL is a build-time constant (`VITE_JELLYFIN_URL`, defaulted in `.env`).
