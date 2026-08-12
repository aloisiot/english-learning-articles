# Grammar practice research

**Date:** 2026-08-12
**Question:** how should a grammar practice tool for this project work — what techniques are actually supported by evidence, which grammar structures belong at which CEFR level, and how should learner progress be represented?

**Decisions taken (2026-08-12):**

- **Audience:** you now, others later — but the research is **structured for all levels A1–C2**, with depth at B2–C1.
- **Priorities:** **proved learning strategies over technology concerns.** Architecture was to be costed both ways, but pedagogy leads.
- **Article link:** loose. Articles can *reference* exercises; the tool is not generated from articles alone.
- **Deliverable:** research docs, in the format of [`research/dictionary/`](../dictionary/). No code.

---

## Contents

| File | What's in it |
|---|---|
| [`01-evidence-base.md`](01-evidence-base.md) | ⭐ **Start here.** What the SLA literature actually supports — and the gap between "improves test scores" and "improves speech" |
| [`02-cefr-inventory.md`](02-cefr-inventory.md) | The two published inventories, a working A1–C2 structure table, and what the corpus already covers |
| [`03-progress-model.md`](03-progress-model.md) | Mastery states vs SRS vs knowledge tracing; what each costs in data |
| [`04-exercise-design.md`](04-exercise-design.md) | Exercise types ranked by transfer, where items come from, feedback design |
| [`05-architecture.md`](05-architecture.md) | Static vs backend, costed both ways — as a consequence of docs 01–04 |
| [`06-plan.md`](06-plan.md) | Phased plan, smallest useful first step first |
| [`07-sources.md`](07-sources.md) | Full reference list, with an explicit note on which claims are abstract-level |

---

## The answer in one page

### The evidence for grammar instruction is mostly evidence about grammar tests

Norris and Ortega's 2000 meta-analysis — the field's most-cited result — found large gains for explicit grammar instruction, largest when metalinguistic explanation was included. But the outcome measures in the synthesised studies were overwhelmingly discrete-point tests that look like the practice itself. Teach a rule explicitly, test by applying a rule explicitly, and you will measure a large effect whether or not anything reached the learner's speech.

This project's purpose is a **conversation** class. So the headline finding, read carelessly, points at exactly the wrong product: a rule-quiz app would be building the well-evidenced half of the problem and skipping the half that matters.

### The design rule that replaces it

Skill acquisition theory supplies the useful frame — **declarative → procedural → automatized** — and one sharp criterion, **transfer-appropriate processing**: *practice transfers to the extent that its cognitive demands resemble the demands of use.*

Applied to exercise types, that inverts the conventional ordering. Meaning-prompted production beats sentence-combining, which beats transformation, which beats gap-fill, which beats multiple choice. Gap-fill isn't worthless — recent work finds it works fine when embedded in real context — but it's the warm-up, not the product.

DeKeyser's prescription also says the explicit phase should be **short**. The `## Grammar Spotlight` already in every article is about the right size. More rule explanation is not the missing ingredient; repeated opportunities to use the rule are.

### Schedule: massed while new, spaced once it works

The spacing literature is the strongest evidence in the strand and the part software is uniquely good at delivering — Kim and Webb's meta-analysis (48 experiments, 3,411 learners) found a medium-to-large advantage for spaced over massed practice. But Suzuki and DeKeyser found massed practice matched distributed practice for accuracy in *proceduralizing* morphology, and possibly produced faster utterances.

These aren't in conflict; they measure different phases. **Concentrate practice to build the skill, space it to keep it.** A stock spaced-repetition scheduler has no concentration phase, which is why FSRS belongs in this design as a layer, not as the model.

Interleaving is the same shape of trade-off: it improves accuracy and *worsens* fluency (more mid-clause pausing), while blocked practice does the reverse. For a conversation-oriented tool the fluency cost is not a rounding error. Block while learning, interleave in review.

### Feedback: immediate, and reformulate rather than explain

Li's meta-analysis puts corrective feedback at **d = 0.64**, maintained over time, with **implicit feedback better retained than explicit**. Timing research favours immediate, though less decisively than intuition suggests. So: correct at the moment of the attempt, show the corrected sentence first, and keep the rule restatement as something the learner can expand.

### What the project already has, and didn't know it had

Same pattern as the dictionary strand. Every article carries `grammar_focus` in its front matter, a `## Grammar Spotlight` with a stated rule and worked examples, and a ~500-word text **written so the target structure occurs naturally and unmarked**. `splitSections()` in `lib/articles.js` already parses these apart.

That's a corpus of naturally-occurring, level-appropriate, topically-coherent exemplars of specific grammatical structures, **written for this exact learner** — the hardest thing in this whole feature to buy, and it already exists. Practice items should be derived from it first.

One more thing fell out of counting the corpus: **the grammar rotation in `docs/class-structure.md` is now exhausted.** Eleven listed points, eleven articles, one each. The next article needs a new structure or a second pass — and a tool that knows the inventory turns that from a recurring judgement call into a query.

### One existing project rule is confirmed by the evidence

`docs/class-structure.md` says the grammar point *"should show up naturally in the article's language, not be visually highlighted/bolded."* Lee and Huang's meta-analysis puts textual enhancement at **d = 0.22** — barely above nothing — with a possible cost to meaning processing. **Keep the rule.** It does mean locating target forms in article text requires parsing rather than a lookup, which is a real implementation cost worth paying.

### The published inventories disagree, and that's the useful part

The Core Inventory (British Council–EAQUALS, A1–C1, free PDF) records what is *taught* at each level. The English Grammar Profile (~1,200 descriptors from 55M words of learner writing, A1–C2) records what learners *produce*. Reading the CIGE PDF directly turned up real conflicts: it puts third conditionals and modal perfects at **B1**, a level earlier than convention; spreads passives and phrasal verbs across four levels; files concessive clauses under *discourse markers* at C1; and **doesn't list cleft sentences or participle clauses at all** — two of the eleven structures this project already teaches.

The right response is not to pick a winner. It's a `level_source` field carrying both, especially since the one study to test EGP statistically found its assignments agree best at *beginner* levels — meaning B2–C1, exactly where this project sits, is the least verified part of it.

One structural finding worth flagging: CIGE's C1 grammar list has only **ten items**, while its C1 discourse-marker and vocabulary rows expand. Advancing past B2 is less about new structures than about discourse, register and lexis — so a grammar drill aimed at C1 should expect diminishing returns.

### Progress: five states, not a percentage

```
UNSEEN → INTRODUCED → PRACTISING → SHAKY ⇄ SOLID → MAINTAINED
```

Knowledge tracing is out — BKT's four parameters per skill can't be fit from one learner's few dozen attempts, and DKT needs large-scale data and is barely interpretable. The right answer to "not enough data to fit a model" is a model with nothing to fit.

No mastery percentage either: a number implies precision a few dozen attempts can't support, and invites optimising the number. Track **accuracy and latency separately**, because the interleaving evidence shows they come apart — a model tracking only accuracy will report progress while fluency stalls.

### Architecture: the pedagogy already decided it

Every feature that would need a server was ruled out on evidence grounds before the architecture question came up — LLM grading lost to self-assessment (the production is the value, not the scoring), runtime generation lost to build-time generation with human review (CEFR alignment can't be self-certified), knowledge tracing lost to a parameterless model. What's left is a few thousand JSON rows and an FSRS calculation, which runs in a browser.

**Build it static, add export/import for the raw attempt log, revisit if cross-device friction becomes real.** Both research strands in this repo have now reached "build-time pipeline, client-side interaction" from opposite starting points — one read-only, one stateful.

### Start with a JSON file

The first phase writes no interactive code. Build the grammar inventory as data, normalise `grammar_focus` against it, and add a verify check. That alone retires the exhausted-rotation problem, makes the C1 coverage gap visible, and gives the `english-learning-article` skill a better input — **and it's worth doing even if the practice tool is never built**, which is the test of a good first phase.

---

## Confidence, stated plainly

This strand rests on a weaker evidential basis than the dictionary research did, and the docs say so throughout.

| Claim class | Confidence | Why |
|---|---|---|
| Spacing, retrieval beat massed/restudy | High | Large meta-analyses, consistent across domains |
| Corrective feedback d = 0.64 | High | Directly reported, widely cited |
| Explicit instruction produces large gains | High on the effect, **high on the measurement critique** | The critique is standard and was acknowledged in the original |
| Weak-interface position | Medium-high | Majority view, not consensus — a live debate |
| Grammar-specific spacing evidence | Medium | Meta-analysts note most studies were vocabulary |
| Interleaving accuracy/fluency trade-off | Medium | Small number of studies |
| The A1–C2 inventory table in `02` | Medium-high — **checked against the Core Inventory PDF**, not against EGP | Disagreements recorded in `02` §2.1 rather than smoothed over |
| Processability Theory's strong form | Medium | Contested; well-supported only for its original morphological scope |
| FSRS benchmark figures | Medium | Consistent across secondary sources; primary benchmark not read |
| LLM item generation quality | **Medium-low** | Thin, recent literature; nothing evaluated against this corpus |

Much of the underlying literature is paywalled, so several claims were read from abstracts, ERIC records or publisher summaries rather than full papers. [`07-sources.md`](07-sources.md) marks each of these **[abstract-level]** and flags the three figures that come from secondary summaries and should be confirmed before being quoted as fact.
