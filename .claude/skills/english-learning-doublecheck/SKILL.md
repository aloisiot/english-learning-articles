---
name: "english-learning-doublecheck"
description: "Independently fact-check a drafted or published English Learning series against its sources, and write a report under research/content/doublecheck-report/. Use when the user asks to double-check, verify, fact-check or review a series or article for accuracy, or asks whether there are inconsistencies in something already written."
---

## English Learning — Doublecheck Skill

Verifies a series' factual claims against its sources, and records the
pass in `research/content/doublecheck-report/<series-slug>.md`.

This is a **separate role** from writing. The value comes from checking
claims against sources rather than re-reading the prose and finding it
plausible — a check that only confirms what the text already says has
done nothing.

### What gets checked

Two different things, and it is easy to do only the first:

1. **Claims against sources** — dates, figures, quotations, attributions
   in `research/content/decisions/<series-slug>.md`.
2. **Consistency across the published articles** — body against its own
   Quick Recap, article against article, and article against the
   constraints recorded in the decisions file.

**Both are required.** A real check found the decisions file accurate on
every claim while two articles still contained problems the decisions
file could not have revealed: a Quick Recap that contradicted its own
body, and a paraphrase that flattened a probabilistic prediction into a
binary one. Recaps are the most likely place for this, because
compressing is where distinctions get dropped — and the recap is what
the learner skims before class.

### Where corrections go

**Fix `decisions/`, not just the report.** The report is deleted when the
series ships (see `research/content/doublecheck-report/README.md`); a
correction that lives only in the report disappears with it.

**Then check whether the correction needs to reach the articles.** A
correction applied to `decisions/` has not been applied to the site.
Grep the article files for the specific wrong claim — it may not be
there at all, but that must be established, not assumed.

**A claim that could not be confirmed is a more valuable finding than
another confirmation**, and belongs in the relevant subject's **Care
needed** block in `decisions/`, not only in the report.

### Report format

Anything is acceptable that makes these visible:

- which file was checked
- each claim, with an explicit status, **and what confirmed it** — name
  the source, don't just write "Verified"
- what could not be confirmed, and why
- whether `decisions/` was changed, and whether any article was

A report of unbroken "Verified" lines is weak evidence: it does not
distinguish a claim checked against a primary source from one that
merely looked right. If a source could not be reached — a
JavaScript-rendered site, a paywall — say so rather than marking the
claim verified from a secondary source that cites it.

### Failure modes seen in practice

- **Stopping at the decisions file.** The commonest one. See above.
- **Quoting a paraphrase.** Check quotations character by character
  against the original. One check caught a quoted phrase where a plural
  had been silently made singular inside quotation marks — a misquote,
  even though the sense survived.
- **Correcting toward a wrong source.** Where a correction contradicts a
  source the file cites, **record why in `decisions/`**. One date was
  wrong because Britannica contradicts itself between two of its own
  pages; without a note saying so, the next check "corrects" it back.
- **Round numbers.** Any suspiciously round figure deserves a look at
  the primary source rather than a summary of it.
- **Asserting a date or detail the file never claimed.** If the report
  adds facts, they need sources too.

### Consistency checks worth running

- **Body vs Quick Recap** in each article — does the recap preserve the
  distinctions the body makes?
- **The same fact across articles** — figures and dates that appear more
  than once must agree.
- **Deliberate repetition** — a callback the decisions file records as
  intentional should not be "fixed", but check the wording varies enough
  to read as a motif rather than as forgetfulness.
- **Against Care needed** — every constraint in `decisions/` is a claim
  the articles were supposed to avoid. Check they did.
- **Structure** — reading-section word count within budget, four to five
  vocabulary terms, three to four questions, the five fixed headings, a
  reading-section title distinct from the front-matter title. Script
  this; don't eyeball it.

### Step by step

1. Read `research/content/decisions/<series-slug>.md` in full, including
   Care needed and Coherence notes.
2. Verify claim by claim against the cited sources. Prefer primary
   sources; note anything unreachable.
3. Read every article in the series. Check body against recap, article
   against article, and article against the recorded constraints.
4. Run the structural checks as a script.
5. Apply corrections to `decisions/` **and** to any affected article.
6. Add a Care needed note for anything unconfirmed, contested, or
   corrected against a cited source.
7. Write the report to
   `research/content/doublecheck-report/<series-slug>.md`, stating what
   confirmed each claim and what changed.
8. Leave the report in place until the series ships, then delete it with
   `progress/<series-slug>.md`.

### Scope note

Corrections here are factual. Rewriting for style, restructuring an
article, or changing an angle is a content decision for the user — flag
it and ask rather than doing it under cover of a fact-check.
