---
name: "english-learning-series"
description: "Plan a connected series of English-learning articles around one theme (e.g. \"Eastern philosophy and the self\"). Use when the user asks to create a series, a mini-series, a set of related articles, or several connected lessons for their English Learning project. Works alongside the english-learning-article skill, which handles writing each individual article."
---

## English Learning — Series Creation Skill

This skill plans a **series**: a set of English-learning articles that
share one theme and are meant to be read/taught in a specific order, each
building on the one before. It covers picking the subjects, researching
them, and sequencing them. It does **not** cover how to write an individual
article — for that, use the `english-learning-article` skill, which owns
the template, the two-title rule, the timing budget, and the
grammar-rotation list. This skill produces the input that feeds into it: a
theme, an ordered list of subjects, sources per subject, and the series'
registry entry.

### What a series is, structurally

A series is regular articles (built exactly per `english-learning-article`)
that additionally carry two front-matter fields:

```yaml
series: a-stable-kebab-case-slug
series_order: 1   # 2, 3, ... — position within the series
```

The series' **title and description are not repeated per article** — they
live once in `site/content/series.json`, the single source of truth:

```json
{
  "a-stable-kebab-case-slug": {
    "title": "Human-Readable Series Name",
    "description": "One or two sentences — the throughline."
  }
}
```

Add (or update) this entry when the series is first drafted — one entry
per series slug, not one per article. `description` is normally the
"Theme & throughline" sentence(s) already written in the tracking file
below — copy it over rather than redrafting, so the two stay in sync. It
renders on the homepage under the series title (see `docs/STYLE-SPEC.md`
§7); a series with no `description` in the registry just skips straight to
the article-count/topic line, so it's fine to leave off if a series
genuinely doesn't need one.

(An older convention repeated `series_title`/`series_description` in
every article's own front matter. `lib/articles.js` still falls back to
those fields for a series that predates the registry, but new series
should only ever need the `series.json` entry above — never add
`series_title`/`series_description` to an article's front matter.)

The site uses `series`/`series_order` plus the registry to show a
"Series" section on the homepage (linking to the `series_order: 1`
article) and a left-hand index sidebar on every article that carries a
`series` field (hidden on articles that don't have one; on mobile it
appears as a plain first section above the article instead of a
persistent sidebar). The sidebar deliberately does not repeat
`description` — it's compact per-article navigation, not a second place
to read the series pitch.

### How many articles — driven by scope, not a fixed count

There is no default series length. The number of subjects is whatever it
takes to cover the theme properly, given that **each article still has to
fit inside a single 30-minute class** (per `english-learning-article`'s
timing budget — roughly a 200-350 word reading section plus the other
fixed sections). Practical rule: if covering a subject properly would blow
past that budget, split it into two subjects instead of compressing it. If
a candidate subject is too thin to justify its own full class, merge it
into a neighbouring one instead of padding it out. The right length is
whatever number of full-budget articles it takes to cover the theme with
no subject starved and none padded — that could be 2, it could be 6.

### The research tracking file — source of truth

Research for a series happens over multiple steps, often multiple
sessions. A single markdown file is the **source of truth** for where
things stand — not the chat history. This matters because a new chat, with
no memory of this conversation, must be able to pick the work up correctly
by reading this file alone.

**Location:** `research/<series-slug>.md`, in a `research/` folder at the
project root (a sibling of `site/`, not inside it — these are working
documents, not published content).

**Create it as the very first step**, before any research happens, and
**update it at the end of every subsequent step** — never batch several
steps of work before writing progress down.

Required sections:

```markdown
# Series: <Series Title>

## Theme & throughline
One or two sentences: what ties the subjects together, and why this order
(chronological or conceptual — see "Sequencing" below). This sentence is
also what becomes the `description` in the series' `site/content/series.json`
entry once drafting starts — write it here first, then copy it over rather
than redrafting it a second time.

## Subjects

| # | Subject | Status | Grammar focus | Sources |
|---|---------|--------|----------------|---------|
| 1 | ...     | researched | Passive voice | [link], [link] |
| 2 | ...     | not started | — | — |

Status values: not started → researching → researched → approved →
drafted → published.

## Progress log
- 2026-08-08: Scouted 3 subjects, proposed throughline.
- 2026-08-08: Researched subject 1, found 2 sources.
(One dated line per work step. Append, never rewrite history.)

## Next step
A single, explicit sentence: exactly what to do next and for which
subject. This is the first thing to read when resuming.

## Coherence notes
Anything a later step must not contradict or repeat: the agreed framing/
throughline, the ordering rationale, grammar points already assigned
(so they aren't reused within the series), tone or register decisions,
any deliberate callbacks between articles (e.g. article 3 references a
concept introduced in article 1).

## Todo
- [ ] Scout remaining subjects
- [ ] Research subject 2
- [ ] Research subject 3
- [ ] Sequence and assign grammar points
- [ ] Present plan for approval
- [ ] Register series in site/content/series.json
- [ ] Draft article 1
- [ ] Draft article 2
- [ ] Draft article 3
- [ ] Mark series published
```

**If asked to resume work on a series, read `research/<series-slug>.md`
first — its "Next step" line, not the surrounding conversation, decides
what happens next.**

### Roles

Treat series research as three distinct passes — they catch different
mistakes, and doing them as separate steps (see "Process" below) is what
keeps any single step's context small.

**1. Scout — defines the subjects and their number.**
Picks a theme, then splits it into as many distinct-but-related subjects
as the theme actually needs (see "How many articles" above). The test for
a good split: each subject must work as a complete, self-contained class
on its own, *and* the set as a whole should read as an arc — each one
either builds on, complicates, or answers the one before it — not several
unrelated items sharing a category label. If a natural throughline can be
stated in one sentence ("how X thinks about Y, across N traditions/
eras/angles"), the split is probably right — and that sentence is your
draft `description` for the registry.

**2. Source verifier — researches each subject independently.**
For every subject, find at least two credible, citable sources (prefer
encyclopedic/academic sources — Britannica, Stanford Encyclopedia of
Philosophy, IEP, established research outlets — over blogs or SEO
content). Pull the core facts/claims the article will actually use, not
just headlines. **Research one subject per step**, writing findings into
the tracking file before starting the next — never research all subjects
in a single uninterrupted pass, since that's exactly the kind of
multi-subject context load this file exists to avoid.

**3. Sequencer — orders the subjects.**
Decide `series_order` for each subject once all are researched. Two
ordering principles, in priority order:

- **Chronological, when the theme has a real time axis.** If the subjects
  are historical developments, a sequence of events, or ideas that
  literally emerged one after another, order them in that time sequence —
  it needs no extra justification.
- **Logical/conceptual, when there's no meaningful time axis.** Order by
  the throughline from step 1 instead (e.g. relational self → no fixed
  self → how to act, each answering a question raised by the last). Record
  the reasoning in "Coherence notes" — the point of a series is that the
  order is deliberate, not alphabetical or arbitrary.

### Grammar rotation within a series

Each article still needs a `grammar_focus`, assigned per the rotation list
in `english-learning-article`. Track assignments in the Subjects table as
they're made, and check it before assigning the next one — avoid repeating
a grammar point within the same series, on top of (not instead of) the
site-wide rotation.

### Process — one step at a time

Each numbered step below is its own unit of work: finish it, update
`research/<series-slug>.md`, stop, and let the next step start fresh
(possibly in a new session). Do not collapse multiple steps into one pass
just because it's convenient in the moment — that's the context problem
this file exists to solve.

1. **Initialize.** Agree the theme with the user. Create
   `research/<series-slug>.md` with the Theme & throughline section filled
   in, an empty Subjects table, and a starter Todo list. Set "Next step" to
   "Scout subjects."
2. **Scout.** Propose subjects (however many the theme needs) and the
   throughline connecting them. Add them to the Subjects table as "not
   started." Update Progress log and Next step.
3. **Research, one subject per step.** For each subject in turn: research
   it, record sources and key facts, mark it "researched" in the table.
   Update Progress log and Next step after each one — even if the next
   step is simply "research subject 2."
4. **Sequence.** Once every subject is "researched," assign
   `series_order` and `grammar_focus` per subject, and record the
   ordering rationale in Coherence notes. Mark subjects "approved" only
   after the user has actually approved them (next step) — until then
   they stay "researched."
5. **Present for approval.** Show the user the subjects, sources, angle,
   grammar assignments, and order — sourced directly from the tracking
   file — before writing any article body. Get approval or changes. Series
   decisions are more expensive to unwind after drafting than a single
   article's content is, so this checkpoint matters more here than for a
   standalone article. On approval, mark subjects "approved" in the table.
6. **Register the series.** Add (or update) the series' entry in
   `site/content/series.json` — `title` and `description` (the
   throughline from step 1/2) — before drafting any article. This is a
   one-time step per series, not repeated per article.
7. **Draft, one article per step.** Write each article using
   `english-learning-article` (template, two-title rule, timing budget,
   vocabulary, discussion questions), adding the two per-article series
   fields (`series`, `series_order`) — title/description come from the
   registry, not the article. Save the file, mark that subject "drafted"
   (then "published" once it's live), and update Progress log and Next
   step before moving to the next article.
8. **Close out.** Once every subject is "published," set Next step to
   "None — series complete" so a future read of the file immediately shows
   there's nothing left to do.

