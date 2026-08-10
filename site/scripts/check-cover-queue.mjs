/**
 * Cover-image queue check — one piece of `npm run verify` (see
 * verify.mjs). Reports anything left `pending` or `failed` in
 * cover-images.json, so it's visible before pushing rather than
 * discovered later.
 *
 * Warn-only, always exits 0: cover images are optional per article
 * (see docs/cover-images.md), so outstanding queue entries
 * mean that image hasn't been sourced yet, not that anything is
 * broken. A push with pending cover-image work is completely valid —
 * this just makes sure it's a visible, intentional state rather than
 * a forgotten one.
 */
import fs from "node:fs/promises";
import path from "node:path";

const trackingPath = path.join(process.cwd(), "scripts", "cover-images.json");

async function main() {
  let tracking;
  try {
    tracking = JSON.parse(await fs.readFile(trackingPath, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") {
      console.log("Cover-image queue check: no cover-images.json — nothing to report.");
      return;
    }
    throw err;
  }

  const outstanding = tracking.images ?? [];

  if (outstanding.length === 0) {
    console.log("Cover-image queue check OK — nothing outstanding.");
    return;
  }

  console.log(`Cover-image queue: ${outstanding.length} entr${outstanding.length === 1 ? "y" : "ies"} not yet resolved (non-blocking):`);
  for (const entry of outstanding) {
    console.log(`  - ${entry.slug} [${entry.status}]${entry.notes ? `: ${entry.notes}` : ""}`);
  }
  console.log("  Run `npm run covers` to process these, or leave them for later — this doesn't block the push.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
