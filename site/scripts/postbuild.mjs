/**
 * Runs after `next build`.
 *
 * 1. Pagefind reads the static HTML in out/ and writes a search index
 *    to out/pagefind/. This is why indexing happens at build time and
 *    needs no server: the index ships as static files alongside the site.
 * 2. The index is copied into public/pagefind so `next dev` can serve it
 *    locally. (Without this, search would only work after a build.)
 *
 * Written in Node rather than shell so it works on macOS, Linux, and
 * Windows alike.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "out");
const builtIndex = path.join(outDir, "pagefind");
const devIndex = path.join(root, "public", "pagefind");

// 1. Index the built HTML.
const result = spawnSync(
  "npx",
  ["--yes", "pagefind", "--site", "out"],
  { cwd: root, stdio: "inherit", shell: process.platform === "win32" },
);

if (result.status !== 0) {
  console.error("\nPagefind indexing failed.");
  process.exit(result.status ?? 1);
}

// 2. Mirror the index into public/ for `next dev`.
await fs.rm(devIndex, { recursive: true, force: true });
await fs.cp(builtIndex, devIndex, { recursive: true });

console.log("Search index copied to public/pagefind for dev use.");
