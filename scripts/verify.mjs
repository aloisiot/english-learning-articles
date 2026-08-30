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

run("Root install (npm ci)", "npm", ["ci"]);
run("Unit tests (vitest)", "npm", ["test"]);
run("Workspace verification", "npm", [
  "run",
  "verify",
  "--workspaces",
  "--if-present",
]);

console.log("\nAll checks passed. Safe to push.");
