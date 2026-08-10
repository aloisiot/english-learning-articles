/**
 * Content/asset integrity check — one piece of `npm run verify` (see
 * verify.mjs). Catches the class of bug where an article's front matter
 * claims an asset exists (a cover image, a series) but the thing it
 * points to was never actually produced or registered — the local
 * equivalent of a 404 that would otherwise only surface once deployed.
 *
 * Two severities:
 *   - Asset paths (cover_image, cover_image_thumb) that don't resolve
 *     to a real file are a HARD FAILURE. These are claimed to exist;
 *     if they don't, the page will 404 on that image in production.
 *   - A `series` slug with no matching entry in content/series.json is
 *     a WARNING, not a failure — the site falls back to the raw slug
 *     as a display title (see lib/articles.js), so it degrades to
 *     "looks wrong" rather than "broken."
 *
 * Exits non-zero only on a hard failure, so it can gate a push without
 * being overly strict about content that's merely incomplete.
 */
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const contentDir = path.join(root, "content");
const publicDir = path.join(root, "public");

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const files = (await fs.readdir(contentDir)).filter((f) => f.endsWith(".md"));

  let registry = {};
  try {
    registry = JSON.parse(
      await fs.readFile(path.join(contentDir, "series.json"), "utf8"),
    );
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }

  const failures = [];
  const warnings = [];

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const raw = await fs.readFile(path.join(contentDir, file), "utf8");
    const { data } = matter(raw);

    for (const field of ["cover_image", "cover_image_thumb"]) {
      const value = data[field];
      if (!value) continue;
      const assetPath = path.join(publicDir, value.replace(/^\//, ""));
      if (!(await fileExists(assetPath))) {
        failures.push(
          `${slug}: ${field} = "${value}" — no file at public/${value.replace(/^\//, "")}`,
        );
      }
    }

    if (data.series && !registry[data.series]) {
      warnings.push(
        `${slug}: series = "${data.series}" has no entry in content/series.json — homepage/sidebar will fall back to the raw slug as a title.`,
      );
    }
  }

  if (warnings.length > 0) {
    console.log("Content warnings (non-blocking):");
    for (const w of warnings) console.log(`  - ${w}`);
    console.log();
  }

  if (failures.length > 0) {
    console.error("Content integrity check FAILED:");
    for (const f of failures) console.error(`  - ${f}`);
    console.error(
      `\n${failures.length} broken reference(s). Fix the front matter or add the missing file before pushing.`,
    );
    process.exit(1);
  }

  console.log(`Content integrity check OK (${files.length} articles checked).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
