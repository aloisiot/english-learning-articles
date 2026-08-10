import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const contentDir = path.join(process.cwd(), "content");
const seriesRegistryPath = path.join(contentDir, "series.json");

/**
 * `content/series.json` is the single source of truth for a series'
 * title and description — `{ "<slug>": { "title": "...", "description":
 * "..." } }`. Before this file existed, every article in a series
 * repeated the same `series_title`/`series_description` in its own
 * front matter, which meant editing a series' title meant editing every
 * article that carried it. A missing file (no series yet) or a missing
 * entry (a series slug not yet registered) are both fine — callers fall
 * back to whatever the article's own front matter says, so this is a
 * non-breaking addition rather than a hard requirement.
 */
function readSeriesRegistry() {
  try {
    return JSON.parse(fs.readFileSync(seriesRegistryPath, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
}

/** Look up one series' registered title/description by slug. Returns
 * `{}` if the series isn't in the registry — callers still need their
 * own fallback for a series that predates registration. */
export function getSeriesMeta(slug) {
  return readSeriesRegistry()[slug] ?? {};
}

/** Read every .md file in /content and return its front matter + slug. */
export function getAllArticles() {
  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".md"));

  return files
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(contentDir, file), "utf8");
      const { data } = matter(raw);
      return { slug, ...data };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Turn a heading into a class-safe name: "Grammar Spotlight: Reported
 * Speech" → "grammar-spotlight". Only the part before the colon is used,
 * so the class stays stable no matter which grammar point an article
 * happens to cover.
 */
function sectionName(title) {
  return title
    .split(":")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Split the body at its `##` headings.
 *
 * Each section of the article template is read differently — the grammar
 * pairs are studied, the vocabulary is scanned, the questions are taken one
 * at a time — so each needs its own treatment. CSS cannot target a section
 * by its heading text, and :nth-of-type() would break the moment an article
 * omits or reorders a section, so the split happens here instead and the
 * page wraps each part in <section class="section-{name}">.
 */
function splitSections(markdown) {
  const sections = [];
  let current = { title: null, name: "preamble", lines: [] };
  let inFence = false;

  for (const line of markdown.split("\n")) {
    // Headings inside a fenced code block are content, not structure.
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;

    const heading = inFence ? null : line.match(/^##[ \t]+(.+?)[ \t]*$/);

    if (heading) {
      if (current.lines.some((l) => l.trim())) sections.push(current);
      const title = heading[1];
      current = { title, name: sectionName(title), lines: [] };
    } else {
      current.lines.push(line);
    }
  }

  if (current.title || current.lines.some((l) => l.trim())) {
    sections.push(current);
  }

  return sections;
}

/**
 * Group every article that carries a `series` field by that field, ordered
 * within each group by `series_order`. Series themselves are sorted by the
 * most recent article they contain, newest first — consistent with how the
 * main article list is ordered.
 */
export function getAllSeries() {
  const registry = readSeriesRegistry();
  const bySlug = new Map();

  for (const article of getAllArticles()) {
    if (!article.series) continue;
    if (!bySlug.has(article.series)) {
      const meta = registry[article.series] ?? {};
      bySlug.set(article.series, {
        slug: article.series,
        // content/series.json is the source of truth; series_title /
        // series_description on the article are only a fallback, kept
        // for series that predate the registry (or haven't been
        // migrated to it yet).
        title: meta.title ?? article.series_title ?? article.series,
        description: meta.description ?? article.series_description ?? null,
        articles: [],
      });
    }
    bySlug.get(article.series).articles.push(article);
  }

  const series = [...bySlug.values()];

  for (const group of series) {
    group.articles.sort(
      (a, b) => (a.series_order ?? 0) - (b.series_order ?? 0),
    );
  }

  series.sort((a, b) => {
    const newest = (group) =>
      Math.max(...group.articles.map((article) => new Date(article.date)));
    return newest(b) - newest(a);
  });

  return series;
}

/**
 * Every article in the same series as `seriesSlug`, ordered by
 * `series_order`. Used to build the sidebar index on an article page.
 */
export function getSeriesArticles(seriesSlug) {
  return getAllArticles()
    .filter((article) => article.series === seriesSlug)
    .sort((a, b) => (a.series_order ?? 0) - (b.series_order ?? 0));
}

/** Read one article by slug, with its body split into rendered sections. */
export async function getArticle(slug) {
  const raw = fs.readFileSync(path.join(contentDir, `${slug}.md`), "utf8");
  const { data, content } = matter(raw);

  const seen = new Map();

  const sections = await Promise.all(
    splitSections(content).map(async ({ title, name, lines }) => {
      const processed = await remark().use(html).process(lines.join("\n"));

      // Names repeat only if an article repeats a heading; ids must still
      // be unique for anchor links to work.
      const count = (seen.get(name) ?? 0) + 1;
      seen.set(name, count);

      return {
        id: count === 1 ? name : `${name}-${count}`,
        name,
        title,
        html: processed.toString(),
      };
    }),
  );

  return { slug, ...data, sections };
}
