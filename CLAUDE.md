# Cadence

**Cadence is a Spotify-like music client for a self-hosted Navidrome server.** The whole library is
never shown as a scroll list — discovery is **recommendations + search + playlists**, and the user
builds their world by adding songs to their **library, playlists, and liked songs**.

Architecture, quality bar, and toolchain descend from the **stoop** app (`~/repo/stoop`) — when a
pattern is unclear here, that's the reference implementation. The one deliberate departure: **there
is no AWS Amplify backend.** Navidrome is the backend, via its **Subsonic/OpenSubsonic API**.

## How we work together (read this first)

The person directing you may be **non-technical** — an "idea guy" who owns the **product**. They
define **WHAT**: features, intent, and Gherkin acceptance scenarios. **You own the HOW**:
architecture, code quality, testing, and every technical decision below.

- **Never ask them to make a technical call.** Don't surface coverage numbers, CRAP, lint,
  file-length, library choices, or client design as questions. Decide them yourself, silently.
- **Translate vague ideas into Gherkin.** When they describe a feature, propose concrete `.feature`
  scenarios (Given/When/Then) and confirm those — that's the spec you build to.
- **Only escalate genuine _product_ questions** — ambiguous behavior, scope, copy, what a screen
  should do. Everything technical is yours.

## Workflow: specs-first vertical slices

Every feature ships as one **thin vertical slice** — UI + hook + API + tests, just enough for the
scenario, nothing speculative.

1. **Spec first.** Write/confirm Gherkin scenarios in `e2e/features/<slice>/*.feature`, steps in
   `e2e/steps/`.
2. **Implement to pass the spec** — follow the architecture and file conventions below.
3. **Run the full quality gate** (`npm run quality`) and get it green locally.
4. **Conventional commit, push, CI green.** Open a PR; CI blocks the merge. Include a **demo
   artifact** (screenshot/video → `files.jpc.io` `/d/` URL) for any user-visible change.

### PR titles (what shipped, not the backstory)

`type(scope): what changed`, from the reader's point of view. No dev narrative ("Phase 2a"), no
issue-number soup — reference issues in the body (`Closes #N`).

### PR demo artifacts

Any user-visible change needs a screenshot/short video generated from the slice's own Gherkin test.
Playwright records `.webm` with `VIDEO=1`; upload to `files.jpc.io` and paste the permanent `/d/`
URL (it renders inline). All `aws` calls use `AWS_PROFILE=personal`; never inline keys.

## Stack

- **Client:** Ionic 8 + React 19 + TypeScript (strict), Vite, Capacitor (iOS).
- **Backend:** **your Navidrome server** (URL is configured, never hardcoded — see Key facts). No
  Amplify, no Cognito, no DynamoDB. Navidrome provides auth, the library, favorites (= liked songs),
  playlists, streaming, and recommendations/similar-songs radio — all natively, all per-user, via its
  **Subsonic/OpenSubsonic REST API**.
- **Search:** Navidrome native `search3` (v1) → Meilisearch via the `marlin-search` indexer (later).
- **Deploy:** static PWA in an nginx container on umbrel via Dockge → cloudflared → `cadence.jpc.io`;
  iOS via Capacitor → TestFlight.

## Architecture

### The Navidrome client (`src/lib/navidrome*.ts` + `subsonicTypes.ts`) — replaces stoop's `dataClient`

Split by concern to stay under the ≤100-line / CRAP≤15 gates:

- **`navidromeConfig.ts`** — base URL from `import.meta.env.VITE_NAVIDROME_URL` (build-time constant;
  one server) + `subsonicAuthParams(session)`, the `u`/`t`/`s`/`v`/`c`/`f=json` query-param builder
  every Subsonic call needs (JSON only, never XML).
- **`navidromeFetch.ts`** — the core `request<T>()`: builds the query string, unwraps the
  `{"subsonic-response": {...}}` envelope, throws typed errors; error code `40` (bad credentials) →
  an `Unauthenticated` sentinel, any other `status:"failed"` → `SubsonicError`.
- **`navidromeErrors.ts`** — `Unauthenticated`, `RequestTimeout`, `HttpError`, `SubsonicError`,
  `isRetryableError`.
- **`sessionStore.ts`** — module-scoped `Session` (`{username, userId, subsonicSalt, subsonicToken}`)
  set by `AuthProvider`, read by `navidromeFetch`, so `xApi.ts` signatures stay credential-free.
- **`navidromeAuth.ts`** — `authenticateByName` (Navidrome's native `POST /auth/login`, the one call
  not in the Subsonic namespace — it's what produces the salt+token pair), `validateToken`
  (`getUser`).
- **`navidromeTypes.ts`** — the app-facing `MediaItem` type (songs/albums/artists/playlists, one
  shape) + `Session`/`LoginResponse`/`NavidromeUser`. `subsonicTypes.ts` holds the raw wire shapes
  (`SubsonicChild`, `SubsonicAlbum`, `SubsonicArtist`, `SubsonicPlaylist`) — never exported past
  `navidromeMapper.ts`'s `mediaItemFromSong/Album/Artist/Playlist` functions, the one place shape
  differences (Subsonic songs use `title` not `name`, a single `artist` string vs OpenSubsonic's
  linkable `artists[]`, `owner`/`public` vs a Jellyfin-style `CanDelete`) get absorbed.
- **`navidromeItems.ts`** / **`navidromeItemsByIds.ts`** / **`navidromeArtists.ts`** — thin typed
  reads/writes: songs, albums, artists, favorites (`star`/`unstar`/`getStarred2`), similar-songs radio
  (`getSimilarSongs2`), batch by-id hydration.
- **`navidromePlaylistLists.ts`** / **`navidromePlaylists.ts`** / **`navidromePlaylistReorder.ts`** —
  playlist CRUD + reads. **`navidromeDiscover.ts`** / **`navidromeGenres.ts`** — Home shelves +
  browse-by-genre (`getAlbumList2`, `getRandomSongs`, `getSongsByGenre`). **`navidromeLyrics.ts`** —
  OpenSubsonic's `getLyricsBySongId`. **`navidromePlayback.ts`** — play tracking via `scrobble`.
  **`navidromeSearch.ts`** — native search (`search3` + a client-side playlist name filter).
- **`navidromeStream.ts`** — pure URL builders (`audioStreamUrl`, `imageUrl`). The auth params ride in
  the query string here too — Subsonic uses the same `u/t/s/v/c/f` for everything, JSON calls and
  `<audio>`/`<img>` `src`s alike, unlike Jellyfin's separate header-vs-query-param auth.

`authClient.ts` wraps `navidromeAuth`; `resolveSession.ts` mirrors stoop's retry-then-`loading` logic
(**an offline launch must return `loading`, never `unauthenticated`** — else airplane mode signs the
user out). `queryClient.ts` is copied verbatim.

### Audio player (`src/features/player/`)

`PlayerProvider` holds **one long-lived `HTMLAudioElement` in a ref** (survives route/modal changes —
not JSX `<audio>`). Queue/next/prev/shuffle live in a pure `queue.ts`. On track change: set
`audio.src = audioStreamUrl(id)`, `play()`; `'ended'` → `next()`. Spotify-style endless play: when
the queue runs dry (or the user taps "radio"), fetch `getSimilarSongs(seedId)` and append. Lock-screen
/ Control Center / Bluetooth controls use the **W3C MediaSession API** (`mediaSession.ts` +
`useMediaSessionSync`) — it drives iOS Now Playing through the WKWebView, so no native plugin is
needed; the native side only sets the `.playback` AVAudioSession (AppDelegate) + `UIBackgroundModes`.

### Code organization (vertical slices)

Features live under `src/features/<feature>/`; tests colocated. File conventions:

- **`useX.ts`** — hooks hold all logic/orchestration; client state via Context + Hook + Provider.
- **`xApi.ts`** — all server state through react-query (`useQuery`/`useMutation`) wrapping the
  Navidrome client. No fetches in components. Every fetch hook returns `isError` (+ `refetch`).
- **`X.tsx`** — components only render.
- **`x.ts`** helpers — pure functions for non-trivial logic (unit-testable, keeps files short).
- **`X.css`** — consume `--cad-*` design tokens / role classes from `src/theme/variables.css`.
- **`LoadState`** (`src/components/LoadState.tsx`) — every data screen uses it: loading / error+retry
  / empty / ready. Error beats empty; an empty result is NOT "still loading".

## Design

Spotify-like: dark-first near-black canvas, elevated surfaces, one green accent, bold sans hierarchy.
**Style only via `--cad-*` tokens / role classes** (`.cad-headline`, `.cad-kicker`, `.cad-meta`, …) —
never hardcoded hex/px. Light/Dark/System is user-switchable (persisted; pre-paint init, no flash).

## Quality gates (non-negotiable — CI + husky pre-commit enforce them)

Run `npm run quality`. **Enforce them yourself; when one fails, fix the code, never the gate.**

- **No `any`, ever.** ESLint `@typescript-eslint/no-explicit-any: error`.
- **Every `.ts`/`.tsx` logic file ≤ 100 lines** (`npm run check:lines`). Over → extract a helper.
  Never raise the limit.
- **≥ 80% coverage** (statements/branches/functions/lines) on every logic file. Fix by writing tests
  — never exclusions. Render-only composition roots (`App.tsx`, `AppRoutes.tsx`, `main.tsx`) are the
  only coverage exemptions.
- **CRAP ≤ 15 per function** (`npm run crap`).
- **Acceptance tests are always Gherkin** (`.feature` + steps), run via Playwright + playwright-bdd.
- **Build + Prettier clean.**
- **Determinism:** unit tests **mock the `navidrome*` modules** — no real network; only Gherkin hits
  the live server. Pure helpers take injected randomness/time. Player: unit-test `queue.ts`; mock the
  Audio element (jsdom can't decode → assert `.src`/`.play` calls).

### Honest e2e

Every data-reading flow asserts on **rendered real Navidrome data**, never just a URL or element
visibility. After sign-in, **wait for the Navidrome session to persist** before reading data — reading
immediately races the session. Use the dedicated **`cadence-test`** Navidrome user for e2e (never
`John`/`guest`).

## Definition of done

1. `npm run quality` green locally (pre-commit enforces it on commit).
2. Gherkin acceptance scenarios + colocated unit tests added and passing.
3. Conventional commit, branch pushed, PR open, **CI green**.
4. PR description includes a demo artifact for any user-visible change.

## Commands

```bash
npm run dev            # Vite dev server on :5173
npm run quality        # full gate: lint + format + check:lines + check:features + coverage + crap + build
npm run format         # Prettier write (run before committing)
npm run test:e2e       # Gherkin acceptance tests (bddgen + Playwright)
npm run gen:icons      # regenerate app icons from assets/icon*.png (add --native for iOS/Android trees)
```

## Slices (build order)

1. ✅ Scaffold + repo + CI + shell + deploy skeleton — tab shell (Home/Search/Library), theme,
   `LoadState`, quality rig, CI, banner'd README, this charter.
2. Auth (Navidrome sign-in) · 3. Playback + Now-Playing · 4. Search (native) · 5. Liked songs · 6. Playlists · 7. Home/recommendations · 8. Native/iOS · 9. (optional) Meilisearch swap.

## Key facts

- **Repo:** `johnpc/cadence`.
- **Navidrome server URL is never hardcoded in source.** The browser calls it directly (server has
  CORS `*`). It's supplied per-context: `.env.local` (local dev/e2e, gitignored), the
  `VITE_NAVIDROME_URL` GitHub secret (CI), or the `NAVIDROME_URL` container env → runtime `config.js`
  (self-host deploy). Committed `.env` is empty, so the App Store build ships with no default and the
  user enters their server on the sign-in screen.
- **iOS bundle id:** `com.johncorser.cadence`. Apple **team id `JW5SC3NYUV`**.
  `ITSAppUsesNonExemptEncryption=false`.
- **Deploy:** nginx image (`Dockerfile` + `deploy/`) → Dockge on umbrel (192.168.7.211) → cloudflared
  `cadence.jpc.io`, host port 8095. See the `umbrel-dockge-dind` skill for the deploy flow.
- **e2e test user:** a dedicated Navidrome `cadence-test` user (creds in `.env.local` /
  CI secrets `TEST_USERNAME` / `TEST_PASSWORD`).
- **CI:** `.github/workflows/ci.yml` — `quality` + `acceptance` matrix (one area per feature). No AWS.
- **Diagnostics (opt-in playback logging):** off by default; **Settings → Diagnostics** turns on an
  on-device ring buffer of player events (`src/lib/diagnostics/`), with a separate opt-in **Upload**
  to a serverless backend. Logs come from BOTH the JS player (`log()` in diagnosticsStore) and the iOS
  native audio layer (AppDelegate/MainViewController → `window.__cadenceNativeLog`, tagged
  `source: ios`). Backend = private `johnpc/cadence-logs` CDK repo (API Gateway → Lambda → S3,
  account 566092841021, `us-west-2`). Ingest URL + non-secret key are baked in at build via
  `VITE_DIAGNOSTICS_URL`/`VITE_DIAGNOSTICS_KEY` (GitHub secrets, injected in **both** ios-deploy.yml's
  build step AND docker-publish.yml's build-args — the native app has no runtime config, so it needs
  them at build). **Read the logs** (`AWS_PROFILE=personal AWS_REGION=us-west-2`): find the bucket via
  `aws cloudformation describe-stacks --stack-name CadenceLogsStack --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" --output text`,
  then `aws s3 ls s3://$B/device/` and `aws s3 cp s3://$B/device/<id>/<date>/ ./logs/ --recursive`;
  each line is enriched JSON (`platform`, `category`, `message`, `fields`, …). Full runbook in README
  "Diagnostics & telemetry".

## Gotchas learned the hard way

Non-obvious things that have cost real time — check here before rediscovering them.

- **Navidrome playlist ownership is a free field — no confirmation call needed.** Unlike Jellyfin
  (which required a separate owner-only-share-list probe per candidate, since its list endpoint
  returned every playlist on the server with no owner field), Subsonic's `getPlaylists` response
  already carries `owner` (username) on every entry. `getPlaylists`/`getPublicPlaylists`
  (navidromePlaylistLists) partition with one synchronous `.filter(p => p.owner === username)` —
  no second network call at all. "Your Library" shows owned; others' public playlists surface as a
  "From the community" Home shelf you can clone.
- **Subsonic auth (salt+token) never goes stale like a bearer token did.** `t = md5(password + salt)`
  is recomputed fresh server-side on every request and verified against the DB password hash — there's
  no server-side session to evict, so (unlike Jellyfin, where a token that had only done GETs could
  401 on a POST) reads and writes behave identically. A `40` error code from any call means the
  password changed, not a stale token.
- **iOS is not the browser.** `HTMLMediaElement.volume` is **read-only on iOS** (hardware buttons only)
  — hide software volume there (`lib/platform.ts` `hasSoftwareVolume()`). iOS lock-screen shows EITHER
  prev/next-track OR ±seek buttons and prefers seek when registered — so on iOS leave
  `seekbackward`/`seekforward` MediaSession handlers unset to surface track skip.
- **Ionic `IonReorderGroup` in a React list:** call `event.detail.complete(false)` so Ionic does NOT
  mutate the DOM (React owns the list), then apply the move to your own state. The event is
  `onIonItemReorder` → DOM `ionItemReorder`.
- **`IonModal`/`IonActionSheet`/`IonAlert` don't render children in jsdom** (need a framework delegate).
  In unit tests, `vi.mock('@ionic/react', ...)` and replace the overlay with
  `({ isOpen, children }) => isOpen ? <div>{children}</div> : null` (or render the alert's buttons
  inline). See `LyricsSheet.test`, `Settings.test`.
- **Unit tests must be hermetic re: `import.meta.env`.** A dev's `.env.local` sets `VITE_NAVIDROME_URL`
  but CI's quality job doesn't — tests that read it must `vi.stubEnv('VITE_NAVIDROME_URL', '')` (or set
  the value they need) so they pass in both. This bit `serverUrlStore`/`SignIn` when the URL default
  went empty.
- **e2e flakiness levers (in priority order):** (0) **`max-parallel: 1` on the acceptance matrix** —
  all ~10 areas hit ONE cloudflared-tunneled Navidrome, and running even 3 concurrently stampedes it
  (auth throttling / stalled first-paint that reads as widespread `search-input`/`navigate` timeouts;
  main went red across 5+ areas at once with `max-parallel: 3`, while every scenario passes alone).
  Serialize the areas — the tunnel is the bottleneck, not the runners. (1) the test user must OWN
  fixtures the scenarios need — `scripts/seed-e2e-user.sh` guarantees an owned playlist + followed
  artist (a CI step). (2) use the shared `DATA_WAIT` (`e2e/steps/timeouts.ts`, 45s CI) for every
  server-backed wait, never a hardcoded 15s. (3) A single fixed e2e DeviceId seeded via
  `page.addInitScript` (BEFORE app boot) so runs reuse one identity — purely cosmetic diagnostics
  tagging now (Subsonic auth has no server-side session keyed by DeviceId to collide on, unlike
  Jellyfin). Warmup step absorbs the tunnel cold-start before tests.
- **Deploy: the active stack compose is separate from the repo.** `/opt/stacks/cadence/compose.yaml`
  (inside Dockge's dind) is hand-maintained — editing `deploy/compose.yaml` in the repo does NOT update
  it. After a deploy-config change, edit the active compose too. VERIFY every deploy:
  `curl -s https://cadence.jpc.io/config.js` shows the right `serverUrl`, and the live `index-*.js` has
  **zero** matches for the server hostname (it must come from runtime config, not the bundle).

## Decisions

- **Navidrome is the backend; we build no backend of our own.** Auth, library, likes, playlists,
  streaming, recommendations are all Navidrome-native (Subsonic/OpenSubsonic). Cadence stores only the
  session (salt+token) + theme (on-device).
- **Log in with Navidrome accounts** (multi-user). No sign-up in-app — users are provisioned in
  Navidrome by the admin.
- **Navidrome base URL is runtime-configured, never hardcoded** (see Key facts + Gotchas). The app
  supports any server; the sign-in screen's Server field is the ultimate source, seeded by an optional
  per-context default.
- **Search is native-first, Meilisearch later.** The `searchSource` adapter makes the swap a one-file
  change. Never ship the marlin `EXPRESS_AUTH_TOKEN` in client JS or expose raw Meilisearch — proxy
  `/api/search` through the serving nginx.
