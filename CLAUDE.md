# Cadence

**Cadence is a Spotify-like music client for a self-hosted Jellyfin server.** The whole library is
never shown as a scroll list — discovery is **recommendations + search + playlists**, and the user
builds their world by adding songs to their **library, playlists, and liked songs**.

Architecture, quality bar, and toolchain descend from the **stoop** app (`~/repo/stoop`) — when a
pattern is unclear here, that's the reference implementation. The one deliberate departure: **there
is no AWS Amplify backend.** Jellyfin is the backend.

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
- **Backend:** **your Jellyfin server** (URL is configured, never hardcoded — see Key facts). No
  Amplify, no Cognito, no DynamoDB. Jellyfin provides auth, the library, favorites (= liked songs),
  playlists, streaming, and
  recommendations/instant-mix radio — all natively, all per-user.
- **Search:** Jellyfin native search (v1) → Meilisearch via the `marlin-search` indexer (later).
- **Deploy:** static PWA in an nginx container on umbrel (host docker daemon) → cloudflared → `cadence.jpc.io`;
  iOS via Capacitor → TestFlight.

## Architecture

### The Jellyfin client (`src/lib/jellyfin*.ts`) — replaces stoop's `dataClient`

Split by concern (each module owns one idea and its tests):

- **`jellyfinConfig.ts`** — base URL from `import.meta.env.VITE_JELLYFIN_URL` (build-time constant;
  one server) + the `X-Emby-Authorization` header builder. **DeviceId is a stable per-install UUID**
  (persisted in Preferences) — never random per request, or it floods Jellyfin's session list.
- **`jellyfinFetch.ts`** — the core `request<T>()`: prepends base URL, attaches the auth **header**
  (not a query param) for JSON calls, throws typed errors; 401 → an `Unauthenticated` sentinel.
- **`sessionStore.ts`** — module-scoped `{token, userId}` set by `AuthProvider`, read by
  `jellyfinFetch`, so `xApi.ts` signatures stay credential-free.
- **`jellyfinAuth.ts`** — `authenticateByName`, `validateToken`.
- **`jellyfinItems.ts`** — thin typed reads/writes (latest, suggestions, favorites, playlists,
  instant-mix, get item).
- **`jellyfinStream.ts`** — pure URL builders (`audioStreamUrl`, `imageUrl`). The token rides in the
  query string here — the one unavoidable place (an `<audio>`/`<img>` `src`); acceptable for a
  self-hosted per-user token.
- **`jellyfinTypes.ts`** — hand-model only the ~15 `BaseItemDto` fields consumed (no `any`; do NOT
  pull the heavy `@jellyfin/sdk`). They are **checked at compile time** against
  `jellyfinOpenApi.d.ts`, generated from the server's own OpenAPI spec (`npm run gen:jellyfin-types`
  with the e2e server up): a renamed or retyped field is a type error naming the field. Add a field
  to the hand model when you consume it; regenerate when CI's Jellyfin image moves.

`authClient.ts` wraps `jellyfinAuth`; `resolveSession.ts` retries a session read that throws, then
reports **`unavailable` — never `unauthenticated`** (else a locked Keychain or a flaky read signs the
user out). `unavailable` is a real state with its own screen ("Try again"); `AuthProvider` keeps
retrying it (`sessionRetry.ts`: backoff timer + app foreground) so it can never become a forever-splash. `queryClient.ts` is copied verbatim.

### Audio player (`src/features/player/`) — a framework-free engine

The player is **one plain TypeScript object**, `createPlayerEngine(deps)` (`player/engine/`), that
owns the one long-lived audio element, the queue, the modes and the transport, in **one store**
(`PlayerState`) plus a separate fast-ticking `progress` store. React is a thin subscriber.

- **The transport is ONE explicit state**: `idle | paused | playing | buffering | casting |
casting-paused` (`engine/types.ts`). `intent` (the user wants sound — survives OS interruptions) and `started` (a
  real play happened this session) sit beside it. Every decision — what an element event does, what
  the end of a track does, what an error does — is a **pure function in `engine/transitions.ts`**.
- **Invariant:** the element holds the queue's current track (or nothing). Queue commands go through
  `setQueue`, which persists and calls `sync`; `sync` loads (generation-guarded, `trackLoader.ts`),
  defers until a session exists, or hands the track to a cast receiver.
- **Platform is injected** (`EngineDeps`: element, session, cast, persistence, toasts, logger).
  `browserEngineDeps` wires the real one; tests use `src/test/engineHarness.ts` + `FakeAudio` and run
  **in plain Node** (`// @vitest-environment node`) — no jsdom, no React.
- **Everything else is a subscriber** in `player/integrations/`, each a plain `attachX(engine)`
  returning a detach: play reporting, endless radio, next-track prefetch, tab title, interruption
  resume, MediaSession, the native iOS Now Playing bridge, the Watch, keyboard shortcuts. They read
  `engine.state` with `watch()` and call engine commands. Add a surface = one line in
  `attachIntegrations.ts`.
- `PlayerProvider.tsx` only creates/starts the engine, attaches integrations and maps state to the
  unchanged `PlayerContext` (`playerContextValue.ts`). Components keep using `usePlayer()`.
- Lock-screen / Control Center / Bluetooth use the **W3C MediaSession API** (publishing fully even
  on native — see Gotchas/memory on iOS Now Playing); the native side sets the `.playback`
  AVAudioSession (AppDelegate) + `UIBackgroundModes`.

### Code organization (vertical slices)

Features live under `src/features/<feature>/`; tests colocated. File conventions:

- **One state per concept, never a cluster of booleans.** A thing with phases gets a union type
  (`AuthStatus`, `TransportStatus`, `CastState`, `DownloadState`, `GrabSearchState`). Shared state is
  derived from its store, not copied into each component (`trackDownloadState`). A screen's overlays
  are one `useOverlay()` value; a confirm-then-run button is `useConfirmedAction()`.
- **`useX.ts`** — hooks hold React-facing orchestration. **Client state has ONE mechanism:**
  `createStore` / `createStoredValue` + `useStore` / `watch` (`src/lib/store.ts`). Module stores
  (session, reachability, cast, settings, download progress, play context…) are all built on it;
  `createStoredValue` keeps a setting's existing localStorage format. Server state stays react-query.
  Context is only for the two player contexts, auth, toast and theme.
- **Large on-device data is IndexedDB** (`src/lib/persistedCollection.ts`): the downloads index and
  offline playlists, hydrated before first render (`hydrateDownloads`), mirrored in memory for sync
  reads, migrated once from the old localStorage keys.
- **Extensions** (`src/extensions/`): acquisition tools — Lidarr requests, Deezer import, Music
  Grabber — are not the core client. Each is gated by one flag in `extensions/flags.ts` and reaches
  core screens only through `extensions/slots/*`; ESLint forbids core code from importing extension
  internals. A new acquisition feature goes here, off by default.
- **`xApi.ts`** — all server state through react-query (`useQuery`/`useMutation`) wrapping the
  Jellyfin client. No fetches in components. Every fetch hook returns `isError` (+ `refetch`).
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
- **Complexity is gated per function, not per file.** ESLint `complexity` ≤ 15 and **CRAP ≤ 15**
  per function. Draw seams along concepts (a module with its own tests), never along line counts —
  the old 100-line file cap produced the 20-hook player. `npm run check:lines` is only a 300-line
  tripwire for files nobody can hold in view.
- **≥ 80% coverage** (statements/branches/functions/lines) on every logic file. Fix by writing tests
  — never exclusions. Render-only composition roots (`App.tsx`, `AppRoutes.tsx`, `main.tsx`) are the
  only coverage exemptions.
- **Acceptance tests are always Gherkin** (`.feature` + steps), run via Playwright + playwright-bdd.
- **Design tokens are real.** `npm run check:tokens` fails on any `var(--cad-*)` that no CSS
  defines — an undefined custom property silently drops the declaration (square corners, zero
  spacing, transparent bars) with no error. Add the token to `variables.css`; never inline a value.
- **Build + Prettier clean.**
- **Determinism:** unit tests **mock the `jellyfin*` modules** — no real network; only Gherkin hits
  the live server. Pure helpers take injected randomness/time. Player: unit-test `queue.ts`; mock the
  Audio element (jsdom can't decode → assert `.src`/`.play` calls).

### Honest e2e

Every data-reading flow asserts on **rendered real Jellyfin data**, never just a URL or element
visibility. After sign-in, **wait for the Jellyfin token to persist** before reading data — reading
immediately races the session. **The suite runs against a hermetic Jellyfin container** with a
generated fixture library (`scripts/e2e-jellyfin.sh`, `scripts/e2e-fixtures.sh`; run one area with
`scripts/e2e-local.sh <area>`). A scenario that needs new library content gets it by extending the
fixture script, never by depending on what happens to be on someone's server. CI never touches the
production Jellyfin; the one live check (`smoke-live`) targets the public demo instance and is
opt-in via secrets.

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
bash scripts/ios-launch-smoke.sh   # (Mac w/ Xcode + Docker, e.g. the mini) build the iOS app, launch it in a
                                   # fresh simulator against the hermetic Jellyfin, PASS only when Home renders
                                   # real data; screenshot + request log in ios-smoke-output/
python3 scripts/asc-testflight.py builds   # recent TestFlight uploads/builds + Apple's errors (needs ASC_* env)
bash scripts/deploy-umbrel.sh check         # read-only: live cadence.jpc.io stack == repo compose?
bash scripts/deploy-umbrel.sh deploy <tag>  # manual deploy / ROLLBACK (main deploys automatically)
gh workflow run deploy-web.yml -f tag=<tag> # same, from the Mac mini runner
```

## Slices (build order)

1. ✅ Scaffold + repo + CI + shell + deploy skeleton — tab shell (Home/Search/Library), theme,
   `LoadState`, quality rig, CI, banner'd README, this charter.
2. Auth (Jellyfin sign-in) · 3. Playback + Now-Playing · 4. Search (native) · 5. Liked songs · 6. Playlists · 7. Home/recommendations · 8. Native/iOS · 9. (optional) Meilisearch swap.

## Key facts

- **Repo:** `johnpc/cadence`.
- **Jellyfin server URL is never hardcoded in source.** The browser calls it directly (server has
  CORS `*`). It's supplied per-context: `.env.local` (local dev/e2e, gitignored), the
  `VITE_JELLYFIN_URL` GitHub secret (CI), or the `JELLYFIN_URL` container env → runtime `config.js`
  (self-host deploy). Committed `.env` is empty, so the App Store build ships with no default and the
  user enters their server on the sign-in screen.
- **iOS bundle id:** `com.johncorser.cadence`. Apple **team id `JW5SC3NYUV`**.
  `ITSAppUsesNonExemptEncryption=false`.
- **Deploy:** CI publishes `mrorbitman/cadence:sha-<short>` (+ `latest`) → umbrel host docker
  (192.168.7.211, stack dir `/home/umbrel/homelab/stacks/cadence`; moved off the legacy Dockge dind 2026-11-16) → cloudflared `cadence.jpc.io`, host port 8095. **`deploy/compose.yaml` is the
  only compose**; the server keeps just a `.env` (tag + URLs + keys). `scripts/deploy-umbrel.sh
check` (read-only drift check), `deploy <tag>` (pull, up, verify config.js + server-agnostic
  bundle). **Deploys are automatic on green main:** `deploy-web.yml` runs on the Mac mini runner
  after `Publish Docker image` succeeds and deploys `sha-<first 7 of the commit>` (refuses a tag
  not on Docker Hub; fails loudly, never auto-rolls back). SSH auth = dedicated key
  `john@mini:~/.ssh/cadence_deploy`, whose umbrel `authorized_keys` line is pinned
  `from="192.168.6.202"` (the mini's LAN IP — if DHCP moves it, deploys fail with "Permission
  denied"; update that line) + no-pty/no-forwarding. **Rollback:** a failed deploy prints the
  previous tag; run `scripts/deploy-umbrel.sh deploy <prev-tag>` from a LAN machine, or
  `gh workflow run deploy-web.yml -f tag=<prev-tag>`. Each deploy backs up the server `.env` as
  `.env.bak-<timestamp>`.
- **e2e users:** `cadence-e2e-<area>` (+ `cadence-e2e-playlists2`), created on the hermetic
  container by `scripts/e2e-jellyfin.sh up` (password `cadence-e2e-pass`, not a secret). For a run
  against a real server, `.env.local` supplies `VITE_JELLYFIN_URL` / `TEST_USERNAME` / `TEST_PASSWORD`.
- **CI:** `.github/workflows/ci.yml` — `quality` + `acceptance` matrix (one hermetic container per
  area) + opt-in `smoke-live` (demo server). No AWS.
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

- **Jellyfin playlist ownership: confirm via `GET /Playlists/{id}/Users`, not `CanDelete` alone.**
  `GET /Items?IncludeItemTypes=Playlist` returns EVERY playlist on the server (all users' + shared) with
  **no `OwnerUserId`** on the response (even in full JSON, v10.11.10). `CanDelete` looks like an
  ownership signal but **an ADMIN can delete anything**, so it's `true` for every playlist for an admin —
  filtering on it alone dumps the whole server into an admin's library. The reliable signal is the
  owner-only share list `GET /Playlists/{id}/Users`: **200 for the owner, 403 for everyone else
  (including admins)**. **Jellyfin 12 made it worse: the bulk `/Items` list reports `CanDelete: true`
  for EVERY playlist even for a plain user** (the single-item GET is still accurate), so there is no
  non-admin shortcut. `partitionByOwnership` (jellyfinPlaylistLists) uses `CanDelete === false` as a
  cheap definite "not mine", then confirms EVERY remaining candidate in parallel via the share endpoint,
  for all users. `scripts/seed-e2e-user.sh` does the same. "Your Library" shows owned; others surface as
  a "From the community" Home shelf you can clone.
- **Jellyfin 12 removed the legacy auth spellings — `X-Emby-Authorization` and `api_key`.** A request
  whose only auth header is `X-Emby-Authorization` is a **400** ("Error processing request." — sign-in
  dies), and a stream URL with `api_key=` is a **401** (every song: "Couldn't play that track"). The full
  `MediaBrowser Client=…, Device=…, DeviceId=…, Version=…, Token=…` value must ride in the standard
  **`Authorization`** header (10.8+), and the stream/query token must be **`ApiKey=`**. Use
  `authHeaders(token)` (jellyfinConfig) for every fetch — it sends both headers with the same value —
  and mirror it in scripts (`-H "Authorization: $H" -H "X-Emby-Authorization: $H"`). Writes also need a
  FRESH token: a stale one returns 401 on POST while reads still work.
- **The iOS app must adopt the UIScene life cycle — or it does not launch at all.** Built with the
  Xcode 27 SDK, an app without `UIApplicationSceneManifest` (Info.plist) + a `SceneDelegate` dies at
  launch ("UIScene life cycle is required for apps built with this SDK") — and that build passed every
  test and reached App Store review. `scripts/ios-launch-smoke.sh` (CI job `ios-launch-smoke`, and a
  gate in ios-deploy.yml before archive) now proves the built app reaches a rendered Home: the app talks
  to the hermetic Jellyfin through a recording proxy (`scripts/ios-smoke-proxy.py`), and PASS needs Home's
  `/Items/Latest` reply AND a cover image for one of those albums, from the seeded DeviceId, with the
  process alive after 20 s and no scene fault/crash. Seed the session via
  `simctl spawn <udid> defaults write com.johncorser.cadence CapacitorStorage.cadence.<key>` (session,
  device-id, server-url). Don't pass `-sdk iphonesimulator` to xcodebuild (drags the Watch target onto
  the phone SDK).
- **iOS deploy: the App Store upload needs the runner user logged in at the Mac mini's console.** The
  runners are LaunchDaemons (`UserName john`); when `john` has no GUI session (another account such as
  `peektest` holds the console), `xcodebuild -exportArchive` dies with SIGTRAP inside AppSSO
  (`_xpc_api_misuse` in `xpc_connection_set_target_uid`) and prints only "failed with exit code 0 but
  produced no further output" — a line that ALSO appears in green runs, so it's noise. That (not
  `-allowProvisioningUpdates`) was every Nov 14–15 failure; a reboot that auto-logged `john` in fixed it.
  Since 2026-11-18 the deploy is the shared `johnpc/ci-workflows` `ios-deploy-capacitor.yml@v1`
  (Cadence keeps its own launch smoke via `smoke-command`), which has no GUI-session precheck: if an
  export dies like that, check the console user first. `scripts/ios-export-diagnostics.sh` (prints the
  xcdistributionlogs + any xcodebuild crash) and `scripts/asc-testflight.py builds` remain for manual
  diagnosis. Apple can take 20+ min to list a fine build.
- **iOS is not the browser.** `HTMLMediaElement.volume` is **read-only on iOS** (hardware buttons only)
  — hide software volume there (`lib/platform.ts` `hasSoftwareVolume()`). iOS lock-screen shows EITHER
  prev/next-track OR ±seek buttons and prefers seek when registered — so on iOS leave
  `seekbackward`/`seekforward` MediaSession handlers unset to surface track skip.
- **The iOS session lives in the Keychain** (`SecureSessionPlugin.swift` + `KeychainStore.swift`,
  JS `src/lib/sessionPersistence.ts`), migrated once from Capacitor Preferences. An UNSIGNED simulator
  build (`CODE_SIGNING_ALLOWED=NO`) and the host-less `AppTests` bundle have no Keychain entitlement
  (`-34018`): the app then falls back to Preferences instead of hanging on its splash, and only the
  locked-before-first-unlock case (`-25308`) is retried. To exercise the real Keychain in the
  simulator, build with `CODE_SIGN_IDENTITY=- CODE_SIGN_STYLE=Manual DEVELOPMENT_TEAM=JW5SC3NYUV`.
- **iOS pauses when the private output goes away** (headphones, Bluetooth, CarPlay, AirPlay —
  `AudioRouteLoss.swift` → `cadence:audioroutelost` → `attachAudioRouteLost`); the lock screen
  advances at the real playback speed (`rate` in the Now Playing state). New native source files are
  added to the Xcode targets with `cd ios/App && ruby add_app_sources.rb`.
- **Ionic `IonReorderGroup` in a React list:** call `event.detail.complete(false)` so Ionic does NOT
  mutate the DOM (React owns the list), then apply the move to your own state. The event is
  `onIonItemReorder` → DOM `ionItemReorder`.
- **`IonModal`/`IonActionSheet`/`IonAlert` don't render children in jsdom** (need a framework delegate).
  In unit tests, `vi.mock('@ionic/react', ...)` and replace the overlay with
  `({ isOpen, children }) => isOpen ? <div>{children}</div> : null` (or render the alert's buttons
  inline). See `LyricsSheet.test`, `Settings.test`.
- **Unit tests must be hermetic re: `import.meta.env`.** A dev's `.env.local` sets `VITE_JELLYFIN_URL`
  but CI's quality job doesn't — tests that read it must `vi.stubEnv('VITE_JELLYFIN_URL', '')` (or set
  the value they need) so they pass in both. This bit `serverUrlStore`/`SignIn` when the URL default
  went empty.
- **No ignored failures. Ever.** A failing test is a bug — in the test, the app, or the
  environment — and the only acceptable response is to find the cause and fix it. There is no
  such thing as a "known flake". Concretely, none of these are allowed in this repo: Playwright
  `retries` > 0, CI retry wrappers (`nick-fields/retry` and friends), re-running a failed job
  until it goes green, `max-parallel` caps "because the server is busy", helper scripts that
  `exit 0` on an error "so the tests can decide", or `test.skip`/`@flaky` tags on a scenario
  that sometimes fails. If a failure's root cause is in the environment (the e2e users were
  deleted, the tunnel is down, Jellyfin changed an auth header), fix the environment and make the
  pipeline FAIL FAST with the real error — `scripts/ensure-e2e-users.sh` / `warmup-jellyfin.sh`
  / `seed-e2e-user.sh` exit non-zero for exactly this reason. Case study (2026-11-15): after the
  Jellyfin 12 upgrade the provisioning script's `X-Emby-Token` header returned 401, it
  "proceeded anyway", every sign-in failed, and each area burned 2 × 25 minutes inside a retry
  wrapper before failing with no report. One honest `exit 1` would have said "user missing" in
  ten seconds.
- **e2e facts:** each area signs in as its own `cadence-e2e-<area>` user with its own
  `E2E_DEVICE_ID` on its own container (`scripts/e2e-jellyfin.sh`); the user must OWN the fixtures
  its scenarios open (`scripts/seed-e2e-user.sh` — playlist, followed artist, liked song);
  server-backed waits use the shared `DATA_WAIT` (`e2e/steps/timeouts.ts`). Jellyfin 12 requires the
  full `Authorization: MediaBrowser … Token="…"` header — the legacy `X-Emby-Token` header and
  `api_key=` query are rejected. Jellyfin 12.4 quirks the fixtures work around: a later audiobook
  part's `Album` is derived from the PREVIOUS part's title (so every part is titled with the book),
  and an album whose discs sit in "Disc N" subfolders returns nothing by `AlbumIds`
  (`getItemTracks` falls back to `ParentId`).
- **Deploy: never edit the compose on the server.** It used to be hand-maintained inside Dockge
  and drifted from the repo. Since 2026-11-15 the live file IS `deploy/compose.yaml`, copied by
  `scripts/deploy-umbrel.sh`; deployment values live in the stack's `.env` (server-only, never
  committed). Change config in the repo, then `deploy`. The script refuses to deploy over drift and
  verifies `config.js` + a bundle with zero server-hostname matches.
- **Jellyfin search: never put `Limit` on a playlist search.** Jellyfin applies it BEFORE filtering
  out other users' private playlists, so on a multi-user server the response can be empty
  (`TotalRecordCount 14, Items []`) and your own playlist never shows. `searchPlaylists` fetches all
  matches and trims client-side. The hermetic e2e server seeds every user's "Cadence Test Mix" so
  this stays covered.
- **The canplay play() retry is one-shot and yields to a pause.** It used to stay attached for the
  whole track, so a later `canplay` (after a seek, or a pause before the stream was ready) restarted
  a track the user had paused.

## Decisions

- **Jellyfin is the backend; we build no backend of our own.** Auth, library, likes, playlists,
  streaming, recommendations are all Jellyfin-native. Cadence stores only the session token + theme
  (on-device).
- **Log in with Jellyfin accounts** (multi-user). No sign-up in-app — users are provisioned in
  Jellyfin by the admin.
- **Jellyfin base URL is runtime-configured, never hardcoded** (see Key facts + Gotchas). The app
  supports any server; the sign-in screen's Server field is the ultimate source, seeded by an optional
  per-context default.
- **The player is an engine, not hooks** (2026-11-15). The 100-line file cap had split it into 20+
  hooks threading refs and callbacks, with side effects in render. Seams now follow concepts; the
  complexity gate is per function (ESLint `complexity` ≤ 15 + CRAP ≤ 15, branches attributed to their
  innermost function).
- **Keep Ionic for now — a judgment call, revisited.** Its pains are real (overlays don't render in
  jsdom, `IonReorderGroup` mutates React's DOM, react-router v5, animations off under test) but a
  rewrite to plain React + CSS is a large, risky change with no user-visible gain today. Rule
  instead: Ionic only for what it uniquely gives us (`IonRouterOutlet`/tabs, overlays, `IonContent`
  scrolling on iOS); new list/row/button UI is plain React + `--cad-*` CSS. Revisit when react-router
  v5 must move, or when an Ionic limitation blocks a feature — the player engine and stores no
  longer depend on Ionic, so the shell is the only part to swap.
- **Search is native-first, Meilisearch later.** The `searchSource` adapter makes the swap a one-file
  change. Never ship the marlin `EXPRESS_AUTH_TOKEN` in client JS or expose raw Meilisearch — proxy
  `/api/search` through the serving nginx.
