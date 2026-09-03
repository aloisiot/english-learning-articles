/**
 * `npm run verify` — the whole-repo push gate.
 *
 * One root install, always, then a per-workspace build/verify. The
 * unconditional root `npm ci` is what keeps the lockfile-drift failure
 * documented in site/scripts/verify.mjs from reopening through a new
 * door now that the lockfile lives here instead of in site/. Per-
 * workspace verify scripts (run via `--if-present`) mean an empty
 * placeholder workspace like class/ or lib/ costs nothing here until a
 * later phase gives it a real pipeline.
 *
 * The env-file check runs first and over everything tracked, not just
 * what is staged: by the time this gate runs, "is a secret staged" is
 * the wrong question. The pre-commit hook asks the staged version of it.
 *
 * Tests run through `test:coverage` rather than `test`, so the 100%
 * threshold on the domain modules is part of the gate rather than a
 * command someone has to remember. It was not, and it silently failed
 * for six commits before anyone ran it — the threshold is configured by
 * path, which makes it exactly the kind of check that stops checking
 * without stopping passing. Costs about a second.
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

run("Env-file secrets", "node", ["scripts/check-env-files.mjs", "--tracked"]);
run("Root install (npm ci)", "npm", ["ci"]);
run("Unit tests + domain coverage (vitest)", "npm", ["run", "test:coverage"]);
run("Workspace verification", "npm", [
  "run",
  "verify",
  "--workspaces",
  "--if-present",
]);

console.log("\nAll checks passed. Safe to push.");
