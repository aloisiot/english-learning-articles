/**
 * Runs before `next dev`.
 *
 * The search index is produced from the static HTML that `next build`
 * generates, so a fresh checkout has no index and search would silently
 * return nothing in development. This builds one automatically the first
 * time, so `npm run dev` just works.
 *
 * The index is a snapshot: after adding or editing articles, run
 * `npm run search:index` to refresh it.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const devIndex = path.join(process.cwd(), "public", "pagefind");

if (fs.existsSync(path.join(devIndex, "pagefind.js"))) {
  process.exit(0);
}

console.log("Preparing search index (first run only)…");

const result = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

// Never block dev on an indexing failure — the site still works without
// search, and the reason will be visible in the build output above.
process.exit(result.status === 0 ? 0 : 0);
