/**
 * Downloads cover images tracked in scripts/cover-images.json, compresses
 * them, and wires them into the matching article's front matter.
 *
 * Why this exists: Claude's sandbox can't reach commons.wikimedia.org
 * (network allowlist), so it can only identify candidate images by web
 * search, not fetch them. This script does the part that needs a normal
 * internet connection — run it locally:
 *
 *   cd site
 *   npm install        # first run only — installs the new `sharp` dependency
 *   node scripts/download-covers.mjs
 *
 * For every entry in the file (each one is a candidate still waiting on
 * a download — see below):
 *   1. Calls the Wikimedia API for that file's current imageinfo —
 *      never trusts the license/author noted in the JSON, since that
 *      was found via search snippets, not read directly off the file
 *      page. Requests a pre-scaled rendition (`iiurlwidth=1600`) rather
 *      than the raw original — earlier versions of this script always
 *      downloaded `imageinfo.url`, the full original, which produced
 *      multi-megabyte files for anything sourced from a high-resolution
 *      scan (one article ended up with a 7MB cover from a 5767×3604
 *      source). Wikimedia's own thumbnail rendition avoids that at the
 *      source instead of relying on local resizing to fix it after.
 *   2. Rejects anything whose license isn't in `allowed_licenses`
 *      (CC0 / Public Domain / CC BY / CC BY-SA) and reports why.
 *   3. Runs the downloaded bytes through `sharp` to produce two files
 *      under `public/images/covers/`:
 *        - `<slug>.webp` — the hero image shown on the article page,
 *          resized to max 1600px wide (comfortably covers the ~707px
 *          display width at 2x/retina density) at quality 80.
 *        - `<slug>-thumb.webp` — a separate, smaller file for the
 *          article-list rows on the homepage/search page, which only
 *          display it at ~144px wide. Before this, list rows reused the
 *          full hero file shrunk by CSS — every row on the homepage was
 *          downloading a multi-hundred-KB (sometimes multi-MB) image to
 *          show a thumbnail. Resized to max 500px wide, quality 75.
 *      WebP over JPEG: ~25-35% smaller at equivalent visual quality,
 *      and supported by every browser likely to view this site.
 *      `withoutEnlargement: true` on both resizes, so a source already
 *      smaller than the target width is never upscaled.
 *   4. Builds the credit line from the live API data (not the JSON's
 *      guess) and writes cover_image / cover_image_thumb /
 *      cover_image_alt / cover_image_credit into content/<slug>.md's
 *      front matter via gray-matter, preserving the rest of the file
 *      untouched.
 *   5. On success, removes the entry from cover-images.json entirely —
 *      once an image is downloaded and wired into its article, the
 *      front matter is the source of truth, so keeping a "done" copy
 *      here would just be a second place to go stale. On failure
 *      (license rejected or a fetch error), the entry stays with
 *      `status: "failed"` and a `notes` explanation, so it's obvious
 *      what's still outstanding and why.
 *
 * Re-run any time: only entries still in the file (i.e. not yet
 * successfully downloaded) are processed.
 *
 * Why not next/image: this site builds with `output: "export"` (a fully
 * static build, see next.config.mjs) — there is no server for Next's
 * on-demand image optimizer to run on, on Vercel or anywhere else. Using
 * next/image here would require `images.unoptimized: true`, which skips
 * resizing/format conversion/compression entirely and just serves the
 * raw file — no different from a plain <img>, but with an extra
 * dependency on Next's image plumbing. Doing the real compression once,
 * at download time, in this script, is the only place it can actually
 * happen for a fully static site.
 */
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import sharp from "sharp";

const root = process.cwd();
const trackingPath = path.join(root, "scripts", "cover-images.json");
const contentDir = path.join(root, "content");

const API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT =
  "EnglishLearningCoverImageBot/1.0 (personal project; contact via repo owner)";

// Hero: displayed at up to ~707px (the site's --measure) — 1600px covers
// that comfortably at 2x/retina density. Thumbnail: displayed at ~144px
// in article-list rows — 500px covers that at up to ~3x density.
const HERO_MAX_WIDTH = 1600;
const HERO_QUALITY = 80;
const THUMB_MAX_WIDTH = 500;
const THUMB_QUALITY = 75;

async function fetchImageInfo(fileTitle) {
  const url = new URL(API);
  url.searchParams.set("action", "query");
  url.searchParams.set("titles", fileTitle);
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|extmetadata|size|mime");
  // Ask Wikimedia to pre-scale rather than always pulling the full
  // original — see the file-level comment above for why this matters.
  url.searchParams.set("iiurlwidth", String(HERO_MAX_WIDTH));
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");

  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });

  if (!res.ok) {
    throw new Error(`Wikimedia API request failed: HTTP ${res.status}`);
  }

  const data = await res.json();
  const page = data?.query?.pages?.[0];

  if (!page || page.missing) {
    throw new Error(`File not found on Commons: ${fileTitle}`);
  }

  const info = page.imageinfo?.[0];
  if (!info) {
    throw new Error(`No imageinfo returned for ${fileTitle}`);
  }

  return info;
}

/** Normalize Commons' free-text LicenseShortName into one of our buckets. */
function normalizeLicense(shortName) {
  if (!shortName) return null;
  const s = shortName.toLowerCase();
  if (s.includes("cc0") || s.includes("public domain")) return "CC0/Public Domain";
  if (s.includes("cc-by-sa") || s.includes("cc by-sa") || s.includes("by-sa")) {
    return "CC BY-SA";
  }
  if (s.includes("cc-by") || s.includes("cc by")) return "CC BY";
  return shortName;
}

function isAllowed(normalized, allowedLicenses) {
  if (!normalized) return false;
  return allowedLicenses.some((allowed) => {
    const a = allowed.toLowerCase();
    const n = normalized.toLowerCase();
    if (a.startsWith("cc0") || a.startsWith("public domain")) {
      return n.includes("cc0") || n.includes("public domain");
    }
    if (a.startsWith("cc by-sa")) return n.includes("by-sa");
    if (a.startsWith("cc by")) return n.includes("by") && !n.includes("by-sa");
    return n === a;
  });
}

async function fetchImageBuffer(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`Failed to download image: HTTP ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/** Resize (never upscale) + re-encode to WebP, writing the result to disk. */
async function writeWebp(buffer, destPath, { width, quality }) {
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await sharp(buffer)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toFile(destPath);
}

async function updateFrontMatter(slug, { coverImage, coverImageThumb, alt, credit }) {
  const mdPath = path.join(contentDir, `${slug}.md`);
  const raw = await fs.readFile(mdPath, "utf8");
  const parsed = matter(raw);

  parsed.data.cover_image = coverImage;
  parsed.data.cover_image_thumb = coverImageThumb;
  parsed.data.cover_image_alt = alt;
  parsed.data.cover_image_credit = credit;

  const output = matter.stringify(parsed.content, parsed.data);
  await fs.writeFile(mdPath, output, "utf8");
}

/**
 * Turn a Commons extmetadata HTML fragment into a short, clean name.
 *
 * extmetadata fields are HTML, not plain text, and vary a lot in shape:
 * some duplicate the visible text inside a hidden `display:none` span
 * (for machine-readability), some are a full paragraph with several
 * links (source/gallery/credit lines), some are just a name. Stripping
 * tags alone turns the first case into "Unknown authorUnknown author"
 * and the second into a wall of concatenated link text — neither is a
 * usable credit. So: drop hidden spans first (their text is a duplicate,
 * not additional content), strip remaining tags, collapse whitespace,
 * and reject the result if it still doesn't look like a short name
 * (too long, or contains more than one URL) rather than emit garbage.
 */
function cleanAuthor(raw) {
  if (!raw) return null;
  let s = raw.replace(/<span[^>]*display:\s*none[^>]*>[\s\S]*?<\/span>/gi, "");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  const urlCount = (s.match(/https?:\/\//g) ?? []).length;
  if (!s || s.length > 120 || urlCount > 1) return null;
  return s;
}

function buildCredit(author, license, licenseUrl) {
  const who = author ?? "an unlisted Wikimedia Commons contributor";
  const licensePart = licenseUrl ? `${license}, ${licenseUrl}` : license;
  return `Photo by ${who} on Wikimedia Commons (${licensePart})`;
}

async function main() {
  const tracking = JSON.parse(await fs.readFile(trackingPath, "utf8"));
  const allowedLicenses = tracking.allowed_licenses ?? [
    "CC0",
    "Public Domain",
    "CC BY",
    "CC BY-SA",
  ];

  let changed = false;
  const remaining = [];

  for (const entry of tracking.images) {
    // Legacy guard: earlier versions of this script left successful
    // entries in place with status "downloaded" instead of removing
    // them. Drop those on sight so the file converges to "only
    // outstanding candidates" the next time it's touched.
    if (entry.status === "downloaded") {
      console.log(`drop  ${entry.slug} (already downloaded, removing stale entry)`);
      changed = true;
      continue;
    }

    console.log(`\n${entry.slug}`);
    console.log(`  file: ${entry.commons_file_title}`);

    try {
      const info = await fetchImageInfo(entry.commons_file_title);
      const meta = info.extmetadata ?? {};
      const licenseShortName = meta.LicenseShortName?.value;
      const normalized = normalizeLicense(licenseShortName);

      if (!isAllowed(normalized, allowedLicenses)) {
        entry.status = "failed";
        entry.notes = `License check failed: got "${licenseShortName}", not in allowed list. Not downloaded — pick a different file.`;
        console.log(`  REJECTED — license "${licenseShortName}" not allowed.`);
        changed = true;
        remaining.push(entry);
        continue;
      }

      // Attribution is the field Commons intends for exactly this reuse
      // case, when present; Artist is the next best (a name, not a
      // credit paragraph); Credit is the least reliable (often a whole
      // "Source/Photographer" block with several links) and gets used
      // only if the other two are missing or don't clean up into a
      // short name — see cleanAuthor above.
      const author =
        cleanAuthor(meta.Attribution?.value) ??
        cleanAuthor(meta.Artist?.value) ??
        cleanAuthor(meta.Credit?.value) ??
        null;
      const licenseUrl = meta.LicenseUrl?.value ?? "";

      // info.thumburl is Wikimedia's own pre-scaled rendition (see
      // iiurlwidth above); info.url is always the full original and is
      // only used as a fallback if a thumburl wasn't returned (e.g. the
      // source is already smaller than HERO_MAX_WIDTH).
      const sourceUrl = info.thumburl ?? info.url;
      const buffer = await fetchImageBuffer(sourceUrl);

      const heroRelative = entry.target_path.replace(/\.[^.]+$/, ".webp");
      const thumbRelative = heroRelative.replace(/\.webp$/, "-thumb.webp");
      const heroPath = path.join(root, heroRelative);
      const thumbPath = path.join(root, thumbRelative);

      await writeWebp(buffer, heroPath, { width: HERO_MAX_WIDTH, quality: HERO_QUALITY });
      await writeWebp(buffer, thumbPath, { width: THUMB_MAX_WIDTH, quality: THUMB_QUALITY });

      const [heroStat, thumbStat] = await Promise.all([
        fs.stat(heroPath),
        fs.stat(thumbPath),
      ]);

      const coverImage = "/" + heroRelative.replace(/^public\//, "");
      const coverImageThumb = "/" + thumbRelative.replace(/^public\//, "");
      const credit = buildCredit(author, licenseShortName, licenseUrl);

      await updateFrontMatter(entry.slug, {
        coverImage,
        coverImageThumb,
        alt: entry.suggested_alt,
        credit,
      });

      changed = true;

      console.log(`  OK — hero ${heroRelative} (${Math.round(heroStat.size / 1024)}KB)`);
      console.log(`     — thumb ${thumbRelative} (${Math.round(thumbStat.size / 1024)}KB)`);
      console.log(`  credit: ${credit}`);
      console.log(`  front matter updated in content/${entry.slug}.md`);
      console.log(`  removed from cover-images.json (done)`);
      // Deliberately not pushed to `remaining` — the front matter just
      // written is now the source of truth for this cover image.
    } catch (err) {
      entry.status = "failed";
      entry.notes = `Error: ${err.message}`;
      changed = true;
      remaining.push(entry);
      console.log(`  FAILED — ${err.message}`);
    }
  }

  tracking.images = remaining;

  if (changed) {
    await fs.writeFile(trackingPath, JSON.stringify(tracking, null, 2) + "\n");
    console.log("\ncover-images.json updated.");
  }

  if (remaining.length === 0) {
    console.log("\nNo outstanding candidates left in cover-images.json.");
  }

  console.log("\nDone. Review each downloaded image and its credit line before committing.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
