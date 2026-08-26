---
name: "english-learning-research"
description: "Conduct and document a research strand for the English Learning project — a decision-ready folder under research/, in the house format (numbered docs, README with the answer in one page, per-claim confidence, measured basis). Use when the user asks to research, investigate, evaluate options for, or plan a new feature or approach for their English Learning project (grammar practice, dictionary lookup, pronunciation, listening, spaced review, and so on)."
---

## English Learning — Research Skill

This skill produces one **research strand** for the English Learning
project: a folder under `research/` that takes an open question, does the
reading, and leaves behind something a decision can actually be made from.

The reference implementation is `research/dictionary/` (written
2026-08-11). When in doubt about format, open it and match it.

### What a research strand is for

The project is a growing collection of short articles supporting 30-minute
online English conversation classes, plus a Next.js static-export site in
`site/`. Research strands are how a **feature or approach** gets thought
through before any code is written — separate from `research/content/`,
which tracks article-series progress, not engineering or pedagogy.

The output is not a summary of what exists. It is an argued
recommendation, with the losing options costed honestly enough that
someone could disagree with the recommendation using the same document.

---

## The house format

```
research/<strand-slug>/
  README.md            ← entry point: the answer in one page
  01-<first-doc>.md    ← numbered, one substantial question each
  02-<second-doc>.md
  ...
  NN-sources.md        ← always last: full reference list, per-claim
  prototype/           ← optional: scripts that produced measured numbers
    README.md
```

### README.md

Opens with a metadata block, then the answer:

```markdown
# <Strand> research

**Date:** YYYY-MM-DD
**Question:** one sentence, phrased as the actual open question.

**Decisions taken (YYYY-MM-DD):**

- **<Axis>:** what was decided, in the user's own terms.
- **<Axis>:** ...
- **<Axis>:** deferred — and say so plainly.

---

## Contents

| File | What's in it |
|---|---|
| [`01-...md`](01-...md) | ⭐ **Start here.** ... |
| ... | ... |

---

## The answer in one page

### <A claim as a heading>

...
```

Rules for the README:

- **Decisions taken** records what the *user* decided, not what the
  research concluded. If they said "no saved words," that goes here
  verbatim in substance. It is the constraint the research had to
  respect.
- **Mark one doc "⭐ Start here."** Exactly one.
- **"The answer in one page"** uses assertions as headings, not topics.
  `### Static export is not the constraint it looks like` — not
  `### Static export`. A reader skimming only the headings should get the
  argument.
- End the README with the **measured basis** if there is one: a table of
  numbers actually produced, and how to reproduce them.

### Numbered docs

Each opens with the question it answers, blockquoted, then a short
answer, then the long one:

```markdown
# 01 — <Title>

> **The question:** ...

**Short answer:** ... (2-4 sentences, bold the operative claim)

---

## 1. <Section>
```

- **One doc per genuinely separate question.** Four to six docs is the
  normal range. If a doc is under ~400 words it probably belongs inside
  another one.
- **Tables for anything comparative.** Options, limits, costs, trade-offs.
  Prose for arguments.
- **Say when you were wrong.** The dictionary research contains the line
  *"My original research missed this entirely."* Keep that habit — a
  correction found mid-research is one of the most valuable things in the
  document.

### The sources doc

Always the last-numbered file. Not a bibliography — a **claim-to-source
map**:

- Open with `All URLs verified on **YYYY-MM-DD**.`
- Group by subject, matching the docs that used them.
- For each source, say **what claim it supports**: not just the link, but
  "Source for: the supported-features list, and the quote *'...'*".
- Record **which repository files were read**, with the date, and which
  claims came from them. Reading the codebase is research.
- Where a figure is quoted, name the source it came from inline.

### Per-claim confidence

Claims in this project are not equally solid, and the document must say
so. Mark anything that isn't directly verifiable:

- A figure read straight off a vendor's docs page today → state it
  plainly, with the page version or date.
- A research finding → name the study, its design, and its limits.
  Effect sizes without sample sizes and study type are not evidence.
- Something inferred, extrapolated, or believed but unchecked → say
  "inferred," "unverified," or "confidence: low" **in the sentence
  itself**, not in a footnote.

Never launder an inference into a fact by dropping the hedge.

### prototype/

Only when a claim needs a number that can't be looked up. Scripts must be
runnable and produce the exact figures quoted in the docs, and
`prototype/README.md` says how to run them. If the docs contain a
measured table, the reader must be able to regenerate it.

---

## Doing the research

1. **Get the decisions first.** Ask the user the questions whose answers
   change the shape of the research — audience, constraints, what the
   deliverable is, what's explicitly out of scope. Record the answers in
   the README's *Decisions taken* block before writing anything else.
   Research done before this is usually research done twice.

2. **Read the repository.** `README.md`, `docs/`, and the parts of
   `site/` the feature would touch. The dictionary strand's single
   biggest finding — that every article already has a hand-written
   `## Key Vocabulary` section better than any API's output — came from
   reading `lib/articles.js`, not from the web. Look for what already
   exists before researching what to add.

3. **Search widely, then verify narrowly.** Find the options, then go to
   each one's primary source — the vendor's own pricing page, the
   published paper, the standards body's own document — rather than a
   blog summarizing it. Note the date and version of what you read.

4. **Measure when you can.** A prototype that produces a real number ends
   an argument that comparative prose would leave open.

5. **Cost the option you're going to reject.** Fully, in the same detail
   as the recommendation, and with a clear statement of what would have
   to change to make it the right call. This is what makes the document
   still useful in a year.

6. **Write the README last.** The one-page answer can't be written until
   the argument exists.

### Evidence standards for pedagogy research

When a strand touches teaching or learning method — as most of this
project's do — the bar is higher than for tooling research, because the
field is full of confident claims that don't replicate:

- Prefer **meta-analyses and systematic reviews** over single studies,
  and single studies over textbook assertions.
- Name the **population**: findings from L2 classroom learners,
  laboratory word-list studies, and children acquiring an L1 are not
  interchangeable, and applying one to another is the most common error
  in this literature.
- Distinguish **what improves test scores** from **what improves
  spontaneous production**. Explicit grammar instruction has a much
  better record on the first than the second, and the gap matters
  enormously for a tool whose purpose is conversation.
- Flag **contested** findings as contested rather than picking a side
  silently. Where the field genuinely disagrees, the research doc should
  say so and explain what the disagreement turns on.
- Be explicit when something is **pedagogical convention rather than
  evidence**. Much of what published courses do is tradition; that's not
  disqualifying, but it should be labelled.

---

## Registering the strand

After the docs are written:

- Add a row to the `research/` description in the root `README.md` repo
  layout block, so the strand is discoverable.
- If the research reaches a decision that changes how articles are
  written or how the site is built, that belongs in `docs/` — the
  research folder records *why*, `docs/` records *what we do now*. Note
  which doc should be updated; don't silently leave the decision only in
  `research/`.

## What this skill does not do

- It does not write article content — that's `english-learning-article`.
- It does not plan article series — that's `english-learning-series`.
- It does not implement the feature. A research strand ends at a
  recommendation and, at most, a prototype that proves a number.

