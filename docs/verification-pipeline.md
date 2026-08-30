# Verification pipeline

Content authoring (writing an article, running the cover-image script)
and the site build (Next.js static export + Pagefind indexing) used to
be two disconnected manual steps — nothing checked that they'd actually
left the repo in a coherent, deployable state before pushing. That gap
caused a real failed production deploy: adding the `sharp` dependency
updated `package.json` but `package-lock.json` was never fully
regenerated, so it silently drifted out of sync. An ordinary
`npm install` papers over an inconsistent lockfile without complaint —
the drift only surfaced when Vercel ran `npm ci` (its actual install
command, per `vercel.json`), which refuses to proceed on a mismatch.

**Since the `class/`/`lib/` workspaces were added** (see
[research/video-calls](../research/video-calls/)), the repo is an npm
workspace and the gate has a root layer and a per-package layer:

**`npm run verify`** (from the repo root) runs, in order, stopping at
the first failure:

1. **`npm ci`** — unconditional, always run, at the root. `package-lock.json`
   lives at the repo root now, covering every workspace
   (`site/`, `class/`, `lib/`) from one install; this is what would have
   caught the `sharp` lockfile drift locally instead of on Vercel.
   Slower than `npm install` and touches `node_modules` — that's the
   point, it's the only way to actually reproduce what production does.
2. **`npm test`** — Vitest, workspace-wide. Cheap, so it always runs in
   full regardless of what changed.
3. **`npm run verify --workspaces --if-present`** — delegates to each
   workspace's own `verify` script, skipping any workspace that doesn't
   define one. Today only `site/` defines one:
   - **Content/asset integrity** (`site/scripts/check-content.mjs`) —
     every `cover_image`/`cover_image_thumb` front-matter path must
     resolve to a real file under `public/`; a `series` slug with no
     `content/series.json` entry is a warning, not a failure (the site
     degrades gracefully to the raw slug as a title — see
     [series.md](./series.md)). **Hard failure** on a missing asset
     file, since that's a real 404 in production, not something the
     site can fall back from.
   - **Cover-image queue** (`site/scripts/check-cover-queue.mjs`) —
     reports any `pending`/`failed` entries left in
     `cover-images.json`. Warning only: cover images are optional per
     article, so outstanding queue entries are a valid state, not a
     broken one.
   - **`npm run build`** — the real static export plus Pagefind
     indexing, i.e. exactly what gets deployed.

**Enforcement:** a `.git/hooks/pre-push` script runs `npm run verify`
automatically on every `git push`, blocking the push if any step fails.
Hooks under `.git/hooks/` are local to a clone and not committed to the
repository — if this repo is ever cloned fresh elsewhere, that file
needs to be recreated there too.

## Running the tests

`npm run verify` runs the whole suite once, which is the right thing
before a push and the wrong thing while actually writing a test. These
are the scripts for the latter, all from the repo root:

| Script | What it does |
|---|---|
| `npm test` | Every workspace, once. |
| `npm run test:watch` | Every workspace, re-running on change. |
| `npm run test:class` | Just `class/` — likewise `test:site`, `test:lib`. |
| `npm run test:coverage` | Adds the coverage table and the thresholds. |
| `npm run test:coverage:open` | The same, then opens the HTML report. |

Each workspace also has its own `test` and `test:watch`, so
`npm test -w class` works from inside a package. That path uses the
workspace's own `vitest.config.ts` rather than the root one, so it runs
the tests but **not** the coverage thresholds — those are configured
once, at the root.

## What the coverage threshold covers

**100% of lines, branches, functions and statements — on the pure
modules only**, currently `class/lib/**` and `lib/**` (see
`vitest.config.mjs`). This is deliberate, and the reasoning is in
[08-implementation-plan.md](../research/video-calls/08-implementation-plan.md):
a repo-wide percentage would be satisfied by testing the easy half and
would say nothing, whereas 100% on the modules that hold the rules is
both achievable and meaningful. It fails loudly when logic is added in
the wrong place, which is the actual thing being enforced.

Two consequences worth knowing:

- **Route handlers, components and the `fetch` wrapper are not
  counted.** They are the I/O edges, and asserting them with mocks
  would prove only that the mock behaves as written.
- **The include globs must track file extensions.** When `class/` moved
  to TypeScript the globs had to gain `ts,tsx`; had they not, they
  would have matched no files and a 100% threshold over nothing passes
  silently — the exact failure the threshold exists to catch.

`test:coverage:open` opens the report **even when the run fails**,
because a threshold failure is usually the moment you most want to see
which branch went uncovered. The exit code is still Vitest's, so it
remains usable in a gate.
