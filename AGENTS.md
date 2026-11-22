# Agents: read `CLAUDE.md` first

`CLAUDE.md` is this repo's charter — architecture, quality gates, workflow, and the gotchas that
cost real time. Everything there applies to every agent and every human working here.

## There is no such thing as a flaky test

A failing test is a bug — in the test, the app, or the environment — and the only acceptable
response is to find the cause and fix it. Never:

- add Playwright `retries`, a CI retry wrapper, or re-run a red job until it goes green;
- `test.skip` / tag a scenario because it "sometimes fails";
- cap parallelism or add sleeps to "calm the server";
- let a helper script `exit 0` on an error so the tests can decide.

If the root cause is in the environment (a deleted e2e user, a changed auth header, a Docker pull
that failed), fix the environment and make the pipeline fail fast with the real error. The case
study behind this rule is in `CLAUDE.md` → "No ignored failures".

## Backends in CI are hermetic or faked, never production

The acceptance suite runs against a throwaway Jellyfin container with a generated fixture library.
Companion services the maintainer's server has but CI cannot (Storyteller, Lidarr, Music Grabber)
are either faked at the network edge with Playwright route handlers (see `e2e/steps/readalong.steps.ts`)
or gated behind `@requires-deploy`. A scenario never depends on what happens to be on someone's server.
