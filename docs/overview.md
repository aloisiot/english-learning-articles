# Overview

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
built — see [tech-stack-decisions.md](./tech-stack-decisions.md) and
"Status" further down. This is the structure as implemented:

```
English Learning/
  README.md
  docs/                             ← this documentation
  research/
    <series-slug>.md               ← per-series research/progress tracking
                                      files (see docs/series.md and the
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

## Status

Site is live in `site/` (Next.js, static export, Pagefind search,
Quiet Editorial design per [docs/STYLE-SPEC.md](./STYLE-SPEC.md)), with
articles stored flat in `site/content/` rather than the per-topic folder
tree originally sketched above. Series navigation (homepage section +
per-article sidebar) is implemented, and the References section is
required on every new article (not yet backfilled onto the five articles
published before the rule). Cover images are self-hosted, compressed
(WebP hero + thumbnail) via `download-covers.mjs`, and the whole pipeline
is gated by `npm run verify` before every push (see
[verification-pipeline.md](./verification-pipeline.md)). Ongoing work is
adding articles to the corpus, using the `english-learning-article` and
`english-learning-series` skills.
