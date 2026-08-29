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
images. `english-learning-research` covers how a research strand under
`research/` is investigated and written up.

## Repo layout

```
English Learning/
  README.md                 ← you are here
  docs/                     ← full documentation (table above)
  research/
    content/                ← per-series research/progress tracking files
    dictionary/             ← research on adding word lookup to the site
    grammar/                ← research on a grammar practice tool: evidence
                              base, CEFR inventory, progress model
    video-calls/            ← research on running a class as a realtime
                              video call: provider costs, the two-app
                              split, and what /class costs the export
  site/                     ← the Next.js site
    content/                ← articles (YYYY-MM-DD-slug.md, flat)
    content/series.json     ← series title/description registry
    app/                    ← pages (homepage, article, search)
    lib/articles.js         ← reads content/, parses front matter
    scripts/                ← cover-image download + verification scripts
```

## Working on the site

Two combined commands cover the usual sequences, so you don't have to
run each step yourself:

```
cd site
npm install

npm run workflow:dev       # covers → build → dev   (start working)
npm run workflow:content   # covers → build         (after writing articles)
```

`build` includes the Pagefind index rebuild, so `workflow:content` is what
makes newly written articles searchable. A cover-image step that can't finish
(usually Wikimedia rate-limiting a batch) prints a warning and the run
continues — images are optional, and anything unresolved stays queued in
`site/scripts/cover-images.json` for a later `npm run covers`.

The individual steps still work on their own:

```
npm run dev       # local dev server
npm run covers    # download/attach queued cover images
npm run build     # production build + search index
npm run verify    # content checks + npm ci + production build
```

Only the `workflow:*` entries may reference `scripts/workflow.mjs`. The
runner calls `dev`, `covers` and `build` by name, so pointing any of those
back at the runner turns the sequence into an infinite loop — it now
detects that and exits with an explanation rather than spinning.

`npm run verify` also runs automatically on `git push` via
`.git/hooks/pre-push` — see
[docs/verification-pipeline.md](docs/verification-pipeline.md).
