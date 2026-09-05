# Western Philosophy — A History of Ideas — progress

Where the work stands. **Deleted when the series ships** — the reasoning
that outlives it lives in
[`../decisions/western-philosophy-history.md`](../decisions/western-philosophy-history.md).

## Subjects

| # | Subject | Status | Article |
|---|---------|--------|---------|
| 1 | Socrates | drafted | `2026-08-26-the-man-who-only-asked-questions.md` |
| 2 | Plato | drafted | `2026-08-26-the-second-world-behind-this-one.md` |
| 3 | Aristotle | drafted | `2026-08-26-bringing-the-forms-back-down.md` |
| 4 | Descartes | drafted | `2026-08-26-doubting-everything-on-purpose.md` |
| 5 | Kant | drafted | `2026-08-26-the-mind-that-shapes-what-it-sees.md` |
| 6 | Nietzsche | drafted | `2026-08-26-no-view-from-nowhere.md` |

## Progress log

- 2026-08-26: Series scoped. User rejected mirroring "Eastern Philosophy
  and the Self"; requested an independent, chronological series, and
  required that connections between thinkers be real (source-backed)
  rather than asserted for narrative convenience.
- 2026-08-26: Researched all six subjects against SEP/IEP/Britannica.
  Verified each adjacent-pair connection individually.
- 2026-08-26: Created branch `content/western-philosophy-history` from
  `main` and moved the research into the `decisions/` + `progress/`
  split that `docs/series.md` requires (the earlier single-file location
  came from a stale cached copy of the skill).
- 2026-08-26: Re-checked the research against main's docs and fixed three
  real defects found:
  1. **Sources.** SparkNotes, TheCollector and philosophy.institute were
     cited; `docs/article-format.md` requires encyclopedic/academic
     sources over blogs and SEO content. All three replaced with SEP,
     IEP and Britannica entries.
  2. **Grammar level.** Comparative/superlative structures, defining
     relative clauses and the first conditional were assigned — all
     A2-B1, below the B2-C1 learner profile in `docs/overview.md`, and
     the defining relative clauses sat too close to the non-defining
     ones already used. Replaced with six genuine B2-C1 points.
  3. **Reading length.** Planning assumed the old 200-350 word target;
     `docs/class-structure.md` raised it to ~500 in August 2026.
     Articles written to the current bound (369-430 words).
  Also rewrote the decisions file to match the house format used by
  `decisions/how-ai-got-here.md` — per-subject sources plus "facts the
  article can use" — instead of the thin summary it had been.
- 2026-08-26: Registered the series in `site/content/series.json` and
  drafted all six articles. Verified programmatically: front matter
  complete, series registered, section headings correct, two-title rule
  satisfied on all six, 4-5 vocabulary items each, 3-4 discussion
  questions each, 2+ references each, no banned sources, `series_order`
  exactly 1-6, and no grammar point colliding with the 11 already used
  in the corpus.

## Next step

Optional: queue cover images in `site/scripts/cover-images.json` and run
`npm run covers` (see `docs/cover-images.md`) — cover images are additive,
so the series is publishable without them. Then run `npm run verify` from
inside `site/` and push the branch.

## Todo

- [x] Scout/confirm final subject list
- [x] Research all six subjects
- [x] Sequence and assign grammar points
- [x] Move research into decisions/progress split per docs/series.md
- [x] Re-check research against main's docs; fix source, level and length defects
- [x] Register series in site/content/series.json
- [x] Draft article 1 — Socrates
- [x] Draft article 2 — Plato
- [x] Draft article 3 — Aristotle
- [x] Draft article 4 — Descartes
- [x] Draft article 5 — Kant
- [x] Draft article 6 — Nietzsche
- [ ] Optional: cover images
- [ ] Run `npm run verify` and push branch
- [ ] Mark series published (delete this file, keep decisions/)
