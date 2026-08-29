/**
 * `npm run verify` — the site's part of the whole-repo push gate. The
 * repo root now owns the workspace install (one root `npm ci`, since
 * `package-lock.json` moved there — see root `scripts/verify.mjs`) and
 * calls this script via `npm run verify --workspace=site`.
 *
 * Why this exists: cover-image processing (download-covers.mjs) and
 * the site build (next build + Pagefind indexing) used to be two
 * disconnected manual steps, run separately with nothing checking that
 * they actually left the repo in a coherent, deployable state. That
 * gap is exactly what caused a real failed production deploy: a
 * `sharp` dependency was added and `package.json` updated, but
 * `package-lock.json` was never fully regenerated, so it drifted out
 * of sync — invisible locally (an ordinary `npm install` will paper
 * over an inconsistent lockfile) and only surfaced when Vercel ran
 * `npm ci`, which refuses to.
 *
 * Runs three checks in order, stopping at the first failure:
 *
 *   1. Content/asset integrity (check-content.mjs) — every
 *      cover_image/cover_image_thumb front-matter path must resolve to
 *      a real file; a `series` slug should have a content/series.json
 *      entry (warning only, not a failure — see that script).
 *   2. Cover-image queue (check-cover-queue.mjs) — reports any
 *      pending/failed cover-images.json entries. Warning only: cover
 *      images are optional, so this never blocks anything.
 *   3. `npm run build` — the real static export (next build) plus
 *      Pagefind indexing (postbuild.mjs), i.e. exactly what Vercel
 *      produces and deploys.
 *
 * Wired into `.git/hooks/pre-push` so it runs automatically — see that
 * file for the caveat that git hooks aren't committed/versioned by
 * default and need to be re-added after a fresh clone.
 */
import { spawnSync } from "node:child_process";

function run(label, command, args) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`\n✗ ${label} failed — stopping here, nothing pushed.`);
    process.exit(result.status ?? 1);
  }
  console.log(`✓ ${label} passed`);
}

run("Content/asset integrity", "node", ["scripts/check-content.mjs"]);
run("Cover-image queue", "node", ["scripts/check-cover-queue.mjs"]);
run("Production build (next build + Pagefind)", "npm", ["run", "build"]);

console.log("\nAll checks passed. Safe to push.");
