/**
 * Point git at the repo's committed hooks, on `npm install`.
 *
 * `.githooks/` is versioned; `.git/hooks/` is not. Setting
 * `core.hooksPath` is what connects the two, and doing it from `prepare`
 * means a fresh clone gets the pre-commit check without anyone having to
 * read a README and remember.
 *
 * Everything here is best-effort and silent on failure by design: this
 * runs inside `npm install`, and a tarball install or a checkout with no
 * .git directory is not a reason to fail the install. The push gate runs
 * the same check (`npm run verify`), so an unwired hook degrades to a
 * later failure rather than to no failure at all.
 */
import { spawnSync } from "node:child_process";

const result = spawnSync("git", ["config", "core.hooksPath", ".githooks"], {
  stdio: "ignore",
});

if (result.status !== 0) {
  console.log("note: could not set core.hooksPath; git hooks are not wired.");
}
