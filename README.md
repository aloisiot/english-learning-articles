# English Learning

A growing collection of short, original articles that each support one
30-minute online English conversation class: a grammar point, a text to
read, vocabulary, and discussion questions.

The site is built with Next.js (static export), lives in `site/`, and is
deployed to Vercel via GitHub.

## Documentation

| Doc | What's in it |
| --- | --- |
| [docs/overview.md](docs/overview.md) | Goal, learner profile, folder structure, current status |
| [docs/article-format.md](docs/article-format.md) | Article template, the two-title rule, References |
| [docs/cover-images.md](docs/cover-images.md) | Cover image sourcing, compression, why not `next/image` |
| [docs/series.md](docs/series.md) | How article series work, the `series.json` registry |
| [docs/class-structure.md](docs/class-structure.md) | 30-minute timing budget, grammar rotation |
| [docs/tech-stack-decisions.md](docs/tech-stack-decisions.md) | Why Next.js/Pagefind/Vercel were chosen |
| [docs/verification-pipeline.md](docs/verification-pipeline.md) | `npm run verify` and the pre-push hook |
| [docs/STYLE-SPEC.md](docs/STYLE-SPEC.md) | Full visual design spec ("Quiet Editorial") |

Two skills drive day-to-day authoring and aren't duplicated here:
`english-learning-article` (writing a single article) and
`english-learning-series` (planning a connected set of articles).
`english-learning-cover-image` handles sourcing and attaching cover
images.

## Repo layout

```
English Learning/
  README.md                 ← you are here
  docs/                     ← full documentation (table above)
  research/                 ← per-series research/progress tracking files
  site/                     ← the Next.js site
    content/                ← articles (YYYY-MM-DD-slug.md, flat)
    content/series.json     ← series title/description registry
    app/                    ← pages (homepage, article, search)
    lib/articles.js         ← reads content/, parses front matter
    scripts/                ← cover-image download + verification scripts
```

## Working on the site

```
cd site
npm install
npm run dev       # local dev server
npm run verify    # content checks + npm ci + production build
```

`npm run verify` also runs automatically on `git push` via
`.git/hooks/pre-push` — see
[docs/verification-pipeline.md](docs/verification-pipeline.md).
