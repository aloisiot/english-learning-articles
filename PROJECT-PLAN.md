# English Learning Articles — Project Plan

Reference doc for the article system used to support 30-minute online English conversation classes.

## Goal

Build a growing collection of short, original articles on subjects of interest, each designed to support one online class: a grammar point to learn, a text to read, vocabulary to pick up, and questions to drive a real conversation.

## Learner profile

- Level: Upper-intermediate / Advanced (B2–C1)
- Language: everything in English (no Portuguese scaffolding)
- Topics of interest so far: science & environment, technology, philosophy (open to more)

## Folder structure

The original plan below (per-topic folders, each with its own `index.md`,
plus a separate keyword index) was superseded once the site was actually
built — see "Site generators" and "Status" further down. This is the
structure as implemented:

```
English Learning/
  PROJECT-PLAN.md
  STYLE-SPEC.md
  research/
    <series-slug>.md               ← per-series research/progress tracking
                                      files (see "Series" below and the
                                      english-learning-series skill)
  site/                             ← the Next.js site
    content/
      YYYY-MM-DD-slug.md            ← every article, flat, one file per
                                       article — no per-topic subfolders
    app/                            ← pages (homepage, article, search)
    lib/articles.js                 ← reads content/, parses front matter
    scripts/                        ← Pagefind indexing (build step)
```

- File naming: `YYYY-MM-DD-slug.md` — sorts chronologically, date visible
  without opening the file. Unchanged from the original plan.
- New subject = a new value in the `topic:` front-matter field. No folder,
  no per-topic `index.md` — the homepage (`site/app/page.js`) lists every
  article by reading front matter directly, and the search page filters by
  topic the same way.
- There is no separate keyword index file; `keywords:` in the front matter
  feeds the search page's keyword filter (via Pagefind) instead.

## Article template

```markdown
---
title:
date: YYYY-MM-DD
level: B2-C1
topic: technology
grammar_focus: reported speech
keywords: [ai regulation, reported speech, tech policy]
series: eastern-philosophy-and-the-self   # optional — see "Series" below
series_title: Eastern Philosophy and the Self
series_order: 1
cover_image: "/images/covers/YYYY-MM-DD-slug.jpg"  # optional — see "Cover images" below
cover_image_alt: "Plain-language description of the photo"
cover_image_credit: "Photo by <Author> on Wikimedia Commons (<License>)"
---

## Grammar Spotlight: [Grammar Point]

Short explanation of the rule (3-4 sentences), with 1-2 example pairs
showing the transformation (e.g. direct speech → reported speech).

## [Title of this article's text — never the word "Article"]

Flexible length, roughly 250-350 words as a guide, summarized from
researched sources. The grammar point is naturally used within the text
(not visually marked/bolded — just genuinely present so the learner sees
it in context).

## Key Vocabulary

- **term** — definition (+ example sentence)
- (4-5 items max)

## Discussion Questions

3-4 questions about the SUBJECT of the article, not the grammar point.
Goal: get a real conversation going, not a grammar drill.

## Quick Recap

2-3 sentence summary, useful to skim before the next class.

## References

Every source actually used to research the article, as a markdown link
list — see "References" below.
```

## Titles — required

Every article carries **two** titles. Both must be written by hand; neither
is optional and neither is derived from the other.

| Where                              | What it is                                                                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `title:` in the front matter       | The article's title. Appears as the page heading, in the subject and keyword indexes, in search results, and in the browser tab. |
| The heading on the reading section | A real title for the text itself, in place of a generic label.                                                                   |

**`## Article` is not an acceptable heading.** It is the same on every page,
so it names nothing: the learner cannot tell one text from another by it,
and there is no way to refer to a piece during class ("take another look at
_The Grid Nobody Planned For_"). It reads as a placeholder that was never
filled in — which is what it is.

**The two titles must not be the same.** The front-matter title frames the
subject for someone browsing the index; the section title names the piece
of writing sitting in front of the learner. Using one as the other prints
the same words on screen twice.

The other five section headings — Grammar Spotlight, Key Vocabulary,
Discussion Questions, Quick Recap, References — stay fixed. They label a
_kind_ of content that is genuinely the same in every article, which is
exactly what the reading section is not.

## References

Every article ends with a `## References` section: a markdown link list
of the sources actually used to research and fact-check it (`- [Source
title](URL)`), never a placeholder. Prefer 2+ sources per article,
encyclopedic/academic ones over blogs or SEO content unless the blog is
itself the primary source under discussion. Only sources that actually
informed the article belong here — not a generic reading list.

References is not part of the 30-minute timing budget below — it's a
written record, not read aloud in class.

For a series article, pull the list from the `Sources` column already
recorded for that subject in `research/<series-slug>.md` rather than
re-researching (see "Series" below and the `english-learning-series`
skill).

Site-wise, References is a section like any other — it gets wrapped in
`.section-references` automatically — but it has no dedicated visual
treatment of its own yet (unlike Key Vocabulary or Quick Recap in
`STYLE-SPEC.md` §6); it currently renders with the same base paragraph/
list styling as the reading section. The five articles published before
this rule was added (`site/content/2026-08-07-*.md`) predate it and have
no References section yet.

## Cover images

Optional per article: a license-free photograph, self-hosted in
`site/public/images/covers/` and referenced via four front-matter
fields (`cover_image`, `cover_image_thumb`, `cover_image_alt`,
`cover_image_credit`). Sourced exclusively from Wikimedia Commons
(CC0/public domain/CC-BY/CC-BY-SA only), never hotlinked — consistent
with the site's "no external data at request time" principle (fonts are
self-hosted the same way, see `STYLE-SPEC.md` §2). Full sourcing and
attribution workflow lives in the `english-learning-cover-image` skill;
rendering treatment is in `STYLE-SPEC.md` §6a/§6b. This is additive, not
a requirement like References — articles with no cover image render
exactly as before.

**Compression.** `site/scripts/download-covers.mjs` (`npm run covers`)
runs every image through `sharp` at download time, producing two WebP
files per article: `<slug>.webp` (the hero, max 1600px wide, quality
80) and `<slug>-thumb.webp` (max 500px, quality 75, used by article-list
rows — see §6b). This exists because Wikimedia Commons source files can
be very large — one early cover ended up at 7.1MB (a 5767×3604
original) before this pipeline existed, downloaded in full for a hero
displayed at roughly 700px wide. The script also requests a pre-scaled
rendition from Wikimedia directly (`iiurlwidth`) rather than always
pulling the full original, so the fix happens at the source as well as
in local re-encoding.

**Why not `next/image`.** This site builds with `output: "export"` (see
`site/next.config.mjs`) — a fully static build with no server for
Next's on-demand image optimizer to run on, including on Vercel.
`next/image` would need `images.unoptimized: true` in that mode, which
serves the raw file with no resizing/compression at all — no different
from a plain `<img>`, but with an added dependency. The compression
that matters here can only happen at content-authoring time (in
`download-covers.mjs`), not at request time, so that's where it lives.

## Series

Some articles are written as a connected set — a small arc where each class
builds on the one before, rather than three unrelated topics. This is
optional: most articles will never carry these fields.

Two front-matter fields per article drive it:

| Field          | What it is                                                                                |
| -------------- | ------------------------------------------------------------------------------------------ |
| `series`       | A stable slug shared by every article in the set, e.g. `eastern-philosophy-and-the-self`. |
| `series_order` | The article's position within the series (1, 2, 3, …). Determines reading/teaching order.  |

The series' **title and description live in one place**,
`site/content/series.json`, rather than being repeated in every
article's front matter:

```json
{
  "eastern-philosophy-and-the-self": {
    "title": "Eastern Philosophy and the Self",
    "description": "One or two sentences — the throughline tying the articles together."
  }
}
```

This replaced an earlier version where `series_title` and
`series_description` were duplicated verbatim across every article in
the set — editing a series' title meant editing every article that
carried it, which is exactly the kind of duplication a single source of
truth avoids. `lib/articles.js` (`getSeriesMeta()`, `getAllSeries()`)
reads the registry first and falls back to `article.series_title`/
`article.series_description` only for a series that predates it — new
series should only ever need an entry here, not per-article fields.
`description` is optional: a series with none just skips straight from
the title to the article-count/topic line on the homepage.

`description` is normally the same sentence(s) as the "Theme &
throughline" already written in `research/<series-slug>.md` during
planning (see the `english-learning-series` skill) — copy it over rather
than redrafting, so the two stay in sync.

Site behaviour (implemented in `site/`):

- The **homepage** shows a "Series" section above the full article list,
  one entry per series, linking to its first (`series_order: 1`) article.
- Any article carrying a `series` field gets a **left-hand sidebar** on
  its page (≥1280px viewports — was 1100px before the 2026-08 measure
  widening, see `STYLE-SPEC.md` §4/§7), listing every article in that
  series in order, with the current one bolded. Articles with no
  `series` field get no sidebar at all — not even an empty one.
- The article itself always stays centred on the page, exactly as on any
  other article — the sidebar sits in a mirrored two-column layout (an
  invisible spacer balances it on the other side) rather than shifting
  the reading column off-centre.
- Below 1280px there's no room for a true sidebar alongside the article's
  measure, so it collapses to a plain block above the article — the first
  thing on the page, not a sidebar — rather than disappearing.
- `series` is also wired into the search page as a filter, alongside
  topic, grammar point, and level.

Nothing about the reading section, grammar spotlight, vocabulary,
discussion questions, or references changes for a series article — it's
still a complete, self-contained 30-minute class on its own. The series is
a navigation layer on top, not a requirement that classes be taken in
order.

**Research tracking.** Planning a series (picking subjects, researching
each one, deciding the order) happens in `research/<series-slug>.md`
before any article is drafted — see the `english-learning-series` skill
for the full process and file format. That file, not chat history, is the
source of truth for where a series' research stands.

## Fitting a 30-minute class — timing budget

The whole article + questions must fit inside the 30-minute class. Article
length is flexible, but should stay close to this budget so a class never
runs long:

| Segment              | Time    | Content sizing                   |
| -------------------- | ------- | -------------------------------- |
| Grammar spotlight    | ~3 min  | 3-4 sentence rule + 1-2 examples |
| Reading the article  | ~5 min  | roughly 200-250 words            |
| Vocabulary review    | ~4 min  | 4-5 terms                        |
| Discussion questions | ~15 min | 3-4 questions                    |
| Buffer/wrap-up       | ~3 min  | —                                |

This replaces the earlier 300-500 word / open-ended question guidance.
Word count is a flexible guideline rather than a hard cap, but questions
stay capped at 3-4.

Notes:

- YAML front matter is the key mechanism for indexing — a script can scan
  all files, read the front matter, and rebuild the subject indexes and
  keyword index automatically.
- Grammar rule should show up naturally in the article's language, not be
  visually highlighted/bolded.
- Discussion questions are about the topic, to keep the conversation
  interesting — occasional grammar-related questions are fine, but not
  the default.

## Grammar rotation (B2–C1 candidates)

To avoid repeating the same structure too often: reported speech,
mixed/3rd conditionals, passive voice, phrasal verbs, cleft sentences,
participle clauses, modal perfect ("should have known"), inversion for
emphasis. Can rotate through these, or fit the article to whatever the
teacher picks for a given class — still open to decide.

## Decisions

- Article length: flexible (not fixed to a strict word count), while still
  fitting the 30-minute class — see timing budget above.
- Grammar point selection: system-driven (rotation through the list above)
  for the beginning.
- Articles to prepare per week/topic: 5.

## Future: website — technology options

Markdown + YAML front matter is deliberately chosen so it converts cleanly
into a website later, with no rework needed now. No server or database is
needed for a project this size — everything below is a static-site
approach (files → HTML, hosted for free).

### Site generators (turn the markdown folder into a website)

**Quartz** — considered, not chosen (see Final decision below).
Purpose-built for exactly this use case: a folder of markdown notes with
front matter, published as a browsable, searchable site.

- Pros: built-in full-text search, backlinks, graph view showing how
  articles connect (e.g. by keyword/grammar tag), reads Obsidian-style
  markdown directly, minimal setup, free hosting (GitHub/Cloudflare Pages).
- Cons: opinionated look (some CSS work needed to make it feel less like
  a "notes wiki" and more like a blog); smaller ecosystem than Astro/Hugo;
  less flexible if the project later needs custom page types.

**Astro**
The general-purpose default for content sites in 2026.

- Pros: very flexible, large plugin/component ecosystem, excellent
  markdown/content-collection support, ships almost no JavaScript so pages
  load fast, easy to design a fully custom blog look.
- Cons: more setup than Quartz — search, tagging, and the keyword index
  aren't built in, need to be added (e.g. with Pagefind); requires more
  hands-on web development than a "point it at a folder" tool.

**Hugo**

- Pros: extremely fast builds (matters only at large scale), no Node.js
  dependency, mature and stable, good for blog-style content.
- Cons: templating language (Go templates) is less intuitive than
  markdown/JS-based tools; smaller advantage for a project this small;
  no built-in search or note-linking.

**Eleventy (11ty)**

- Pros: simple mental model (content + template → HTML), minimal
  abstraction, easy to understand and modify by hand, good documentation.
- Cons: like Hugo, needs search and indexing added manually; less
  "batteries-included" than Quartz for a personal knowledge-base style site.

**Obsidian Publish / Notion**

- Pros: fastest to get something live, no coding required.
- Cons: recurring subscription cost, far less control over search/index
  behavior and design, harder to make it look like a real blog.

### Search (only needed once the site is generated)

**Pagefind** — Recommended.

- Pros: purpose-built for static sites, runs entirely in the browser
  (no server/database/monthly bill), indexes the built HTML directly,
  works with any generator (Quartz, Astro, Hugo, Eleventy all support it),
  free, privacy-friendly (no queries sent anywhere).
- Cons: search runs after a build step, so it needs the site to be
  rebuilt when new articles are added (fine for this project's pace).

**Lunr.js** — older alternative, similar idea (client-side, no backend)
but less actively developed and less optimized for large content sets
than Pagefind.

**Algolia** — hosted, very polished, used by many docs sites, but
overkill here: free tier is generous but it's a third-party service with
usage limits, unnecessary for a personal project of this size.

### Hosting (all free for this project's scale)

**Cloudflare Pages** — considered, not chosen (Vercel selected instead,
see Final decision below).

- Pros: unlimited sites, unlimited bandwidth, unlimited requests on the
  free tier, fast global CDN, simple Git-based deploys.
- Cons: slightly less "beginner tutorial" coverage than GitHub Pages.

**GitHub Pages**

- Pros: simplest option if the articles already live in a GitHub repo,
  free custom domain support, zero extra accounts needed.
- Cons: 1GB site size cap, ~100GB/month soft bandwidth limit, 10
  builds/hour — all far beyond what this project needs, but worth knowing.

**Netlify**

- Pros: most polished all-in-one deploy experience, instant rollbacks,
  branch previews, easy drag-and-drop deploys.
- Cons: bandwidth (100GB/month) and build-minute caps are lower than
  Cloudflare's free tier.

### Final decision: Next.js stack

Chosen requirements: no template-language framework (component-based,
reusable, cross-platform), deeply customizable blog design, no data
handed off to third-party services, easy long-term deploy/maintenance,
and strong build-time indexing/search — all pointing to a Next.js stack
rather than Quartz/Astro/Hugo/Eleventy.

- **Framework: Next.js**, statically rendered (SSG) rather than
  server-rendered. Every article page is pre-built to full HTML at build
  time — important for SEO, since crawlers (Google, Bing, Brave Search,
  DuckDuckGo) see complete content immediately with no JavaScript
  execution required, unlike client-rendered pages. Configure via
  `generateStaticParams()` for each article route, or `output: 'export'`
  for a fully static export if server features aren't needed at all.
- **Content parsing:** `gray-matter` reads the YAML front matter already
  used in the article template (title, date, level, topic, grammar_focus,
  keywords); Markdown/MDX renders the article body.
- **Search/indexing: Pagefind**, run as a postbuild step. It indexes the
  static HTML Next.js just generated, so indexing happens automatically
  at build time — no manual index maintenance, no runtime server calls.
  Search then executes entirely client-side in the visitor's browser;
  no query or content data is ever sent to a third party (rules out
  Algolia, which is hosted).
- **Hosting: Vercel** — already in use, Git-push deploys, minimal
  long-term maintenance overhead.

Build flow: markdown articles → Next.js static build (SSG) → Pagefind
indexes the output → deploy to Vercel. Every step happens at build time;
nothing depends on a live server or external service at request time.

Recommended order at the time: build up a corpus of markdown articles
first, then wire up the Next.js site once there's enough content to make
search and navigation genuinely useful. That site is now built — see
"Status" below — so this section is kept as a record of the decision
rather than as forward-looking guidance.

## Status

Site is live in `site/` (Next.js, static export, Pagefind search,
Quiet Editorial design per `STYLE-SPEC.md`), with articles stored flat in
`site/content/` rather than the per-topic folder tree originally sketched
above. Series navigation (homepage section + per-article sidebar) is
implemented, and the References section is required on every new article
(not yet backfilled onto the five articles published before the rule).
Ongoing work is adding articles to the corpus, using the
`english-learning-article` and `english-learning-series` skills.
