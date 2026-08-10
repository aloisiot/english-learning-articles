/**
 * Downloads cover images tracked in scripts/cover-images.json and wires
 * them into the matching article's front matter.
 *
 * Why this exists: Claude's sandbox can't reach commons.wikimedia.org
 * (network allowlist), so it can only identify candidate images by web
 * search, not fetch them. This script does the part that needs a normal
 * internet connection — run it locally:
 *
 *   cd site
 *   node scripts/download-covers.mjs
 *
 * For every entry in the file (each one is a candidate still waiting on
 * a download — see below):
 *   1. Calls the Wikimedia API for that file's current imageinfo —
 *      never trusts the license/author noted in the JSON, since that
 *      was found via search snippets, not read directly off the file
 *      page.
 *   2. Rejects anything whose license isn't in `allowed_licenses`
 *      (CC0 / Public Domain / CC BY / CC BY-SA) and reports why.
 *   3. Downloads the full-resolution image to `target_path`
 *      (public/images/covers/<slug>.<ext>), reusing the source
 *      extension.
 *   4. Builds the credit line from the live API data (not the JSON's
 *      guess) and writes cover_image / cover_image_alt /
 *      cover_image_credit into content/<slug>.md's front matter via
 *      gray-matter, preserving the rest of the file untouched.
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
 */
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const trackingPath = path.join(root, "scripts", "cover-images.json");
const contentDir = path.join(root, "content");

const API = "https://commons.wikimedia.org/w/api.php";

async function fetchImageInfo(fileTitle) {
  const url = new URL(API);
  url.searchParams.set("action", "query");
  url.searchParams.set("titles", fileTitle);
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|extmetadata|size|mime");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "EnglishLearningCoverImageBot/1.0 (personal project; contact via repo owner)",
    },
  });

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

function extensionFromMime(mime, fallbackUrl) {
  const byMime = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };
  if (mime && byMime[mime]) return byMime[mime];
  const match = fallbackUrl.match(/\.(jpe?g|png|webp)(?:\?.*)?$/i);
  return match ? `.${match[1].toLowerCase().replace("jpeg", "jpg")}` : ".jpg";
}

async function downloadFile(url, destPath) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "EnglishLearningCoverImageBot/1.0 (personal project; contact via repo owner)",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to download image: HTTP ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, buffer);
}

async function updateFrontMatter(slug, { coverImage, alt, credit }) {
  const mdPath = path.join(contentDir, `${slug}.md`);
  const raw = await fs.readFile(mdPath, "utf8");
  const parsed = matter(raw);

  parsed.data.cover_image = coverImage;
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
      const ext = extensionFromMime(info.mime, info.url);
      const destRelative = entry.target_path.replace(/\.[^.]+$/, ext);
      const destPath = path.join(root, destRelative);

      await downloadFile(info.url, destPath);

      const coverImage = "/" + destRelative.replace(/^public\//, "");
      const credit = buildCredit(author, licenseShortName, licenseUrl);

      await updateFrontMatter(entry.slug, {
        coverImage,
        alt: entry.suggested_alt,
        credit,
      });

      changed = true;

      console.log(`  OK — saved to ${destRelative}`);
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
