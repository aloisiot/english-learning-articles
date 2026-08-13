# Brazil, From Above — progress

Work queue for this series. **Delete this file once the series ships** —
see [`../README.md`](../README.md) for what "shipped" means.

Nothing here is worth keeping afterwards: statuses, logs and next-step
notes all go stale the moment the work is done, and a stale one makes a
finished series look unfinished. The reasoning that outlives the work is
in [`../decisions/brazil-from-above.md`](../decisions/brazil-from-above.md).

## Subjects

| #   | Subject                                                            | Status      | Grammar focus                     | Sources |
| --- | ------------------------------------------------------------------ | ----------- | --------------------------------- | ------- |
| 1   | Before 1500 — the forest that was never wild                        | drafted     | Reporting passives                | —       |
| 2   | The colony that received the most enslaved people on earth          | drafted     | Past perfect / narrative tenses   | —       |
| 3   | The prince who declared independence from his own father            | drafted     | Defining relative clauses         | —       |
| 4   | Abolition, and who actually ended slavery                           | drafted     | Nominalisation                    | —       |
| 5   | Vargas and the invention of modern Brazil                           | drafted     | *used to* / *would*               | —       |
| 6   | Twenty-one years, and the deal that ended them                      | drafted     | Future in the past                | —       |

Status values: not started → researching → researched → approved →
drafted → published.

## Progress log

- 2026-08-13: Agreed theme and scope. User chose the "transitions from
  above" throughline, chose to write for a reader who does not know
  Brazil (against the recommendation of assuming knowledge), and chose to
  end the series in 1985 rather than continue to the present. Six
  subjects scouted, grammar points assigned, decisions file created.
- 2026-08-13: Researched all six subjects. Sources and facts recorded in
  the decisions file, with per-subject "care needed" notes. Two primary
  sources verified directly (the 2026 *Nature* earthworks paper and the
  CNV report portal). One sourcing caveat logged: slavevoyages.org is
  JavaScript-rendered and unreadable from this environment, so the
  slave-trade figures come from sources citing it and need confirming on
  the live Estimates page before drafting.
- 2026-08-13: Branch `content/brazil-from-above` created; this pattern is
  now the documented default for content work (see
  `research/content/README.md`). Registered the series in
  `site/content/series.json`, added the six new grammar points to
  `docs/class-structure.md`, and drafted all six articles (reading
  sections 281-345 words; structure verified programmatically). Queued
  six cover-image candidates. Covers not yet fetched; index not yet
  rebuilt.

## Next step

Run `npm run covers` from `site/` to fetch the six queued cover images,
then `npm run workflow:content` to rebuild the search index. Review the
drafts, merge `content/brazil-from-above` into `main`, and delete this
file.

## Todo

- [x] Agree theme, register and end point with the user
- [x] Scout subjects and assign grammar points
- [x] Research subject 1
- [x] Research subject 2
- [x] Research subject 3
- [x] Research subject 4
- [x] Research subject 5
- [x] Research subject 6
- [x] Present full plan for approval
- [x] Add the six new grammar points to `docs/class-structure.md`
- [x] Register series in `site/content/series.json`
- [x] Draft articles 1-6
- [x] Queue cover images
- [ ] Run `npm run covers`
- [ ] Rebuild search index (`npm run workflow:content`)
- [ ] Delete this file
