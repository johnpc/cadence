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
- **Backend:** **your Jellyfin server** (`https://jellyfin.jpc.io`). No Amplify, no Cognito, no
  DynamoDB. Jellyfin provides auth, the library, favorites (= liked songs), playlists, streaming, and
  recommendations/instant-mix radio — all natively, all per-user.
- **Search:** Jellyfin native search (v1) → Meilisearch via the `marlin-search` indexer (later).
- **Deploy:** static PWA in an nginx container on umbrel via Dockge → cloudflared → `cadence.jpc.io`;
  iOS via Capacitor → TestFlight.

## Architecture

### The Jellyfin client (`src/lib/jellyfin*.ts`) — replaces stoop's `dataClient`

Split by concern to stay under the ≤100-line / CRAP≤15 gates:

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
  pull the heavy `@jellyfin/sdk`).

`authClient.ts` wraps `jellyfinAuth`; `resolveSession.ts` mirrors stoop's retry-then-`loading` logic
(**an offline launch must return `loading`, never `unauthenticated`** — else airplane mode signs the
user out). `queryClient.ts` is copied verbatim.

### Audio player (`src/features/player/`)

`PlayerProvider` holds **one long-lived `HTMLAudioElement` in a ref** (survives route/modal changes —
not JSX `<audio>`). Queue/next/prev/shuffle live in a pure `queue.ts`. On track change: set
`audio.src = audioStreamUrl(id)`, `play()`; `'ended'` → `next()`. Spotify-style endless play: when
the queue runs dry (or the user taps "radio"), fetch `InstantMix(seedId)` and append. Lock-screen /
Bluetooth controls: W3C MediaSession on web + a Capacitor bridge on native, both behind
`mediaSession.ts`.

### Code organization (vertical slices)

Features live under `src/features/<feature>/`; tests colocated. File conventions:

- **`useX.ts`** — hooks hold all logic/orchestration; client state via Context + Hook + Provider.
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
- **Every `.ts`/`.tsx` logic file ≤ 100 lines** (`npm run check:lines`). Over → extract a helper.
  Never raise the limit.
- **≥ 80% coverage** (statements/branches/functions/lines) on every logic file. Fix by writing tests
  — never exclusions. Render-only composition roots (`App.tsx`, `AppRoutes.tsx`, `main.tsx`) are the
  only coverage exemptions.
- **CRAP ≤ 15 per function** (`npm run crap`).
- **Acceptance tests are always Gherkin** (`.feature` + steps), run via Playwright + playwright-bdd.
- **Build + Prettier clean.**
- **Determinism:** unit tests **mock the `jellyfin*` modules** — no real network; only Gherkin hits
  the live server. Pure helpers take injected randomness/time. Player: unit-test `queue.ts`; mock the
  Audio element (jsdom can't decode → assert `.src`/`.play` calls).

### Honest e2e

Every data-reading flow asserts on **rendered real Jellyfin data**, never just a URL or element
visibility. After sign-in, **wait for the Jellyfin token to persist** before reading data — reading
immediately races the session. Use the dedicated **`cadence-test`** Jellyfin user for e2e (never
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
2. Auth (Jellyfin sign-in) · 3. Playback + Now-Playing · 4. Search (native) · 5. Liked songs · 6. Playlists · 7. Home/recommendations · 8. Native/iOS · 9. (optional) Meilisearch swap.

## Key facts

- **Repo:** `johnpc/cadence`.
- **Jellyfin server:** `https://jellyfin.jpc.io` (CORS `*`; the browser calls it directly).
- **iOS bundle id:** `com.johncorser.cadence`. Apple **team id `JW5SC3NYUV`**.
  `ITSAppUsesNonExemptEncryption=false`.
- **Deploy:** nginx image (`Dockerfile` + `deploy/`) → Dockge on umbrel (192.168.7.211) → cloudflared
  `cadence.jpc.io`, host port 8095. See the `umbrel-dockge-dind` skill for the deploy flow.
- **e2e test user:** a dedicated Jellyfin `cadence-test` user (creds in `.env.local` /
  CI secrets `TEST_USERNAME` / `TEST_PASSWORD`).
- **CI:** `.github/workflows/ci.yml` — `quality` + `acceptance` matrix (one area per feature). No AWS.

## Decisions

- **Jellyfin is the backend; we build no backend of our own.** Auth, library, likes, playlists,
  streaming, recommendations are all Jellyfin-native. Cadence stores only the session token + theme
  (on-device).
- **Log in with Jellyfin accounts** (multi-user). No sign-up in-app — users are provisioned in
  Jellyfin by the admin.
- **Jellyfin base URL is a build-time constant** (`VITE_JELLYFIN_URL`). One server; revisit only if
  multi-server support is ever wanted.
- **Search is native-first, Meilisearch later.** The `searchSource` adapter makes the swap a one-file
  change. Never ship the marlin `EXPRESS_AUTH_TOKEN` in client JS or expose raw Meilisearch — proxy
  `/api/search` through the serving nginx.
