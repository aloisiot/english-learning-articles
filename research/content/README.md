# Content research

Per-series planning material, split across two folders by **how long it
stays true**:

```
research/content/
  decisions/<series-slug>.md   ← why the series is written this way — kept
  progress/<series-slug>.md    ← where the work stands — deleted when done
```

Planning a series (picking subjects, researching each one, deciding the
order) happens here **before** any article is drafted. See
[`docs/series.md`](../../docs/series.md) and the
`english-learning-series` skill for the full process.

## Work on a branch

**Content research and article creation happen on a branch named
`content/<slug>`**, not on `main`:

```
content/brazil-from-above      a series
content/how-ai-got-here        a series
content/<article-slug>         a standalone article
content/<topic>                a topic-level batch
```

The slug is the same one used for the files in this folder, for the key
in `site/content/series.json`, and for the `series:` value in each
article's front matter — one identifier throughout.

Why bother, for a single-author project: a series takes several sessions
and touches research files, six or more articles, the cover-image queue,
`series.json` and sometimes `docs/`. Half-finished, that state is
confusing on `main` — articles exist but aren't indexed, covers are
queued but not fetched. A branch keeps `main` in a state where every
article is complete and searchable, and makes "what did this series
change?" a single diff.

## The split

The two halves fail in opposite ways, which is why they are separate
files.

**`progress/`** is a work queue: the subject table with its statuses, the
dated progress log, the "next step" line, the todo list. All of it is
true only until the next piece of work happens. A stale "next step:
add cover images" on a finished series is worse than no file at all — it
makes completed work look outstanding, and a future session will act on
it. This half is **deleted the moment the series ships**.

**`decisions/`** is the reasoning: the theme and throughline, the sources
and the evidence pulled from them, the angle each article takes, the
"care needed" constraints, and the coherence notes recording deliberate
callbacks and accepted trade-offs. None of that expires. It is what a
future revision needs in order not to quietly undo a choice that was made
on purpose. This half is **kept permanently**.

The distinction is volatility, not importance. Sources and extracted
quotes live in `decisions/` because they stay true, even though they were
gathered during the same work that produced the statuses.

### Why the reasoning has to be kept

Each article's own `## References` records the sources it used, and
`site/content/series.json` records the throughline. Neither records
*what was deliberately avoided*. For example, in the "How AI Got Here"
series: don't claim that *Perceptrons* or the Lighthill report **caused**
the AI winter, because the peer-reviewed sources dispute it; don't repeat
the widely-circulated 1958 New York Times perceptron quotation, because
it can't be traced past blogs; article 5 overlaps the standalone
AI-energy article **on purpose**, so don't "fix" the duplication.

Delete that and the next revision reintroduces exactly the errors the
research existed to prevent.

## File naming

**The same filename in both folders: the series slug, no suffix.**

```
research/content/decisions/how-ai-got-here.md
research/content/progress/how-ai-got-here.md
```

That slug is already the key in `site/content/series.json` and the value
of `series:` in every article's front matter, so reusing it avoids
inventing a fourth identifier for the same thing, and makes the pairing
checkable by script. A `-progress` suffix would only repeat what the
folder already says.

Each file opens with a one-line pointer to its counterpart, since
filename linkage is invisible to someone who opens one file directly.

## When a series ships

Delete `progress/<series-slug>.md`. Keep `decisions/<series-slug>.md`.

A series has shipped when all of these are true:

- every subject in the table has an article in `site/content/`
- each article has `cover_image` / `cover_image_thumb` /
  `cover_image_credit`, and the files exist under
  `site/public/images/covers/`
- `site/scripts/cover-images.json` has no entries left for the series
- the series is registered in `site/content/series.json`
- the site has been rebuilt (`npm run workflow:content`) so the articles
  are in the search index

Deletion is safe either way: the file is committed, so `git log --` on
its path recovers it.

Keep this README — it documents the folder, it isn't a series file.

---

Sibling folders under `research/` hold research that isn't about article
content — e.g. [`../dictionary/`](../dictionary/) on adding word lookup,
and [`../grammar/`](../grammar/) on grammar practice.
