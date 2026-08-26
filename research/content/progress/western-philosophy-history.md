# Western Philosophy — A History of Ideas — progress

Decisions/reasoning for this series: `research/content/decisions/western-philosophy-history.md`

## Subjects

| # | Subject | Status |
|---|---------|--------|
| 1 | Socrates | researched |
| 2 | Plato | researched |
| 3 | Aristotle | researched |
| 4 | Descartes | researched |
| 5 | Kant | researched |
| 6 | Nietzsche | researched |

## Progress log

- 2026-08-26: Series proposed and scoped with user. User rejected
  mirroring "Eastern Philosophy and the Self"; requested an independent,
  chronological series. User instruction: only assert connections between
  thinkers that are actually supported by sources.
- 2026-08-26: Researched all six subjects via web search against
  SEP/IEP/academic sources. Verified each adjacent-pair connection
  individually. Sequenced chronologically (matches conceptual order).
  Assigned grammar_focus per subject, checked against site-wide rotation.
- 2026-08-26: User pointed out that series-creation instructions live on
  `main`, not in the skill's cached copy. Research was originally written
  to a single file at `research/western-philosophy-history.md` (the
  skill's documented location), which is stale relative to
  `docs/series.md` / `research/content/README.md` on `main` — those
  specify a `research/content/decisions/<slug>.md` (permanent) +
  `research/content/progress/<slug>.md` (deleted on ship) split instead.
  Created branch `content/western-philosophy-history` from `main` (via a
  worktree, since the connected working folder blocks the delete/rename
  operations a normal `git checkout`/`stash` needs) and moved the research
  into the correct decisions/progress split on that branch. Content itself
  was re-verified against `docs/article-format.md`,
  `docs/class-structure.md` grammar rotation, and `docs/series.md` — no
  factual or structural problems found; only the file location was wrong.

## Next step

Present the reorganized plan to the user for approval. On approval:
register the series in `site/content/series.json`, then draft articles
one at a time per `english-learning-article`, pulling References from the
Sources column in the paired `decisions/` file.

## Todo

- [x] Scout/confirm final subject list
- [x] Research subject 1: Socrates
- [x] Research subject 2: Plato
- [x] Research subject 3: Aristotle
- [x] Research subject 4: Descartes
- [x] Research subject 5: Kant
- [x] Research subject 6: Nietzsche
- [x] Sequence and assign grammar points (verified against sources)
- [x] Move research into decisions/progress split per docs/series.md
- [ ] Present plan for approval
- [ ] Register series in site/content/series.json
- [ ] Draft article 1 — Socrates
- [ ] Draft article 2 — Plato
- [ ] Draft article 3 — Aristotle
- [ ] Draft article 4 — Descartes
- [ ] Draft article 5 — Kant
- [ ] Draft article 6 — Nietzsche
- [ ] Mark series published (delete this progress file, keep decisions/)
