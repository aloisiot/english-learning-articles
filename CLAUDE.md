# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Start here

`README.md` covers the product, the authoring workflow and the docs
table — read it for anything about writing articles.

**The reasoning behind the code lives in `research/<strand>/`.** Each
strand answers one question, with a `README.md` that gives the answer on
one page and numbered documents behind it. Two strands are load-bearing:

- `research/video-calls/` — the class app. `08-implementation-plan.md` is
  the live plan; `09-sources.md` is the register of unverified claims.
- `research/accounts-and-scheduling/` — accounts, roles, scheduling, and
  how the class app is organised. **Designed, not built.**

When a decision looks arbitrary, it is usually recorded. Check before
changing it.

## Commands

Run from the repo root — this is an npm workspace (`site`, `class`,
`lib`), with one lockfile at the root.

```bash
npm run verify          # the gate: env check → npm ci → tests → per-workspace verify → builds
npm test                # every workspace
npm run test:class      # one workspace (also :site, :lib)
npm run test:coverage   # enforces the 100% threshold on domain modules
npm run check:env       # env-file secret scan, over everything tracked
```

A single file or case:

```bash
npx vitest run --project class test/room.test.ts
npx vitest run --project class -t "derives the same name"
```

Dev servers — both default to port 3000, so run one at a time:

```bash
npm run dev -w class    # the class app, at /class
cd site && npm run dev  # the articles site
```

**`npm run verify` must pass before every commit.** It is the push gate
and it exists because a drifted lockfile once broke production —
`docs/verification-pipeline.md` has that story.

## Architecture

**Two deployed applications, one domain.** `site/` owns the domain;
`class/` is served at `/class` through a **Vercel microfrontends group**
declared in `site/microfrontends.json`. This is not a rewrite — a
`vercel.json` rewrite was tried across several deploys and never applied.
Do not reintroduce one.

| | `site/` | `class/` |
|---|---|---|
| Language | JavaScript | TypeScript |
| Output | static export (`output: "export"`) | Next.js server, `basePath: "/class"` |
| Holds secrets | no — it has no server | yes, all of them |
| Design | "Quiet Editorial", serif, light/dark tokens | dark, bespoke to the call |

**The two seams between them are different on purpose**
(`research/video-calls/07-two-app-architecture.md` §3): article content
crosses over **HTTP**, as static JSON the site publishes; code and styles
cross through the **`lib/` workspace** at compile time. Never read files
across workspace folders.

`lib/` is still nearly empty. It is being populated now — see
`research/accounts-and-scheduling/07-design-system.md`.

### Inside `class/`

Currently cut by layer: `lib/` is pure domain held at 100% coverage,
`server/` holds adapters (`daily.ts` is *"the only place in the app that
talks to Daily over the network"*), `app/` is routes and UI.

**This is being reorganised into vertical feature slices** — `call`,
`access`, `scheduling`. Read
`research/accounts-and-scheduling/06-application-architecture.md` before
adding files, so new code lands in the target shape rather than the old
one.

## Conventions

- **Decisions go in pure, tested modules; I/O goes in thin adapters.**
  `class/lib/daily-request.ts` (builds requests and interprets responses
  as data, fully tested) against `class/server/daily.ts` (holds nothing
  but the `fetch`) is the model to copy.
- **Do not test against mocks.** The rule, from
  `research/video-calls/08`: mocking the thing under test *"would prove
  only that the mock behaves as written"*. If something needs a mock to
  be testable, extract the decision and test that.
- **Golden values are pinned to an externally-derived expectation, never
  regenerated from the code under test.** A test that asserts the code
  does what the code does is not a test. Changing a golden value needs a
  reason.
- **Control characters go in source as escapes**, never as literal bytes.
  A literal NUL in `room.ts` made git report `Bin 4715 -> 5690 bytes`
  instead of a diff, which is how a room-name change passed review unseen.
- **Coverage thresholds are configured by path** in `vitest.config.mjs`.
  Move a module without moving its glob and the threshold silently stops
  covering it — the suite still passes, guarding nothing.
- **Comments explain why, not what.** `class/lib/link.ts` and
  `class/server/config.ts` set the register. Commit messages do the same:
  conventional commits, with a body that explains the reasoning rather
  than restating the diff.

## Things that will confuse you otherwise

- `npm run verify` **regenerates** `site/lib/dictionary-data/*.json`.
  Expected. `git restore site/lib/dictionary-data/` before committing.
- `.DS_Store` is tracked and permanently shows as modified. Do not commit it.
- A **pre-commit hook** in `.githooks/` (wired by the root `prepare`
  script) refuses any env file but a template, and any `.env.example`
  that declares a value. It reports names and line numbers, never values.
- **Vercel MCP calls need `teamId: "aloisiot"`** — the username, used as
  the team slug. The numeric team ID is accepted and returns *empty
  results rather than an error*, which reads as "nothing exists".

## Deployment

Two Vercel projects from this repo: `english-learning-articles` (Root
Directory `site/`) and `english-learning-class` (`class/`). Both need
*Include files outside the Root Directory*, because each `installCommand`
is `cd .. && npm ci` against the root lockfile.

Environment variables are set for **Production only**, deliberately —
`class/server/config.ts` throws on anything missing, so preview
deployments will 500 until they are wired. That is a decision, not a bug.

## Current state

The class app is deployed and **a real class has been run by two people
on two networks** (2026-09-03), exercising chat, the unread badge, screen
sharing and a vertical phone camera. `research/video-calls/08` Phase 4's
gate is closed. Room expiry without intervention is the one part nobody
watched.

Accounts, roles, scheduling and the session record are being built on top
of it now — `research/accounts-and-scheduling/` is the strand.
