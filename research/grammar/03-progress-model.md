# 03 — The progress model: representing what the learner knows

> **The question:** how should the tool represent "you're at 70% on the present perfect"? And what does each candidate model actually require in return — in data, in learner effort, and in complexity?

**Short answer:** **per-structure mastery states with a spacing schedule attached** — five or six named states a structure moves between, not a percentage. Do **not** build knowledge tracing: BKT and DKT both need volumes of interaction data a single learner will never generate, and DKT's accuracy advantage only appears on large datasets. And do not apply uniform spaced repetition either — the evidence in [`01-evidence-base.md`](01-evidence-base.md) §5 supports **massed practice while a structure is new, spacing once it works**, which is a different scheduler from the one Anki runs.

---

## 1. The options, and what each costs

| Model | What it tracks | Data needed | Fit here |
|---|---|---|---|
| Streak / counter | Sessions done | Nothing | Motivational only, says nothing about knowledge |
| **Mastery states** | Per-structure state in a small state machine | Tens of attempts per structure | **Recommended** |
| SM-2 / FSRS | Per-item recall probability | FSRS: trained on ~700M reviews (pretrained defaults ship with it) | Good for the scheduling layer, wrong as the *unit* |
| Bayesian Knowledge Tracing | P(knows skill) per skill, 4 parameters | Hundreds of interactions per skill, many learners to fit | Over-engineered; parameters unfittable at this scale |
| Deep Knowledge Tracing | Learned representation of skill state | Large-scale data; degrades on small datasets | No |

### Why not knowledge tracing

BKT models each skill with four parameters (prior knowledge, learn rate, slip, guess), which must be **fit from data**. With one learner and a few dozen attempts per structure, those parameters would be fit to noise. DKT is worse on this axis: it is "predominantly data-driven and benefits a lot from large-scale student learning data," and the comparative literature finds BKT holds up better on datasets with few interactions per student while DKT leads only on large ones. DKT is also poorly interpretable — a real cost when the whole point is telling a learner what to work on.

Knowledge tracing exists to serve *many* learners at once. This tool serves one, with a possible future of a handful. **The right response to "not enough data to fit a model" is a model with no parameters to fit.**

> **Confidence: high.** This follows from the stated data requirements in the knowledge-tracing literature and the arithmetic of a single-learner corpus; it doesn't depend on a contested finding.

### Why not plain spaced repetition either

FSRS is genuinely better than SM-2 — its three-variable memory model (difficulty, stability, retrievability) predicts recall more accurately than SM-2 for 99.5% of users in the open benchmark of 700M+ reviews, buying roughly 20–30% fewer reviews for the same retention, and Anki made it the default in late 2023. If items are being scheduled, FSRS is the algorithm to use.

But two mismatches stop it being the *model*:

**a) A grammar structure is not a flashcard.** SRS assumes a discrete item with a right answer, recalled or not. "Participle clauses" is a productive rule applying to unlimited sentences; the learner doesn't recall it, they deploy it with varying success. Scheduling the *structure* is coherent; scoring it binary pass/fail is not.

**b) The schedule the evidence supports is not the SRS schedule.** Suzuki and DeKeyser (2017) found massed practice matched distributed practice for accuracy in proceduralizing morphology, and possibly produced *faster* utterances — while Kim and Webb's meta-analysis found a medium-to-large spacing advantage for retention. The reconciliation is that these measure different phases. **Concentrate practice to build the skill; space it to keep it.** A stock SRS scheduler expands intervals from the first correct answer and never has a concentration phase.

## 2. The recommended model

### Per-structure states

```
UNSEEN → INTRODUCED → PRACTISING → SHAKY ⇄ SOLID → MAINTAINED
```

| State | Meaning | Scheduling |
|---|---|---|
| `UNSEEN` | Not encountered | Eligible to be introduced when prerequisites are `SOLID`+ |
| `INTRODUCED` | Rule read (an article's Grammar Spotlight) | Practise soon, **massed** |
| `PRACTISING` | Being worked on, accuracy still climbing | **Massed** — several sessions close together |
| `SHAKY` | Was working, recent attempts failing | Return to massed; interleave with `confusable_with` |
| `SOLID` | Reliably accurate in constrained production | Switch to **spaced** review, expanding intervals |
| `MAINTAINED` | Long intervals, occasional check | Spaced, low frequency |

The states are honest about what's measurable. There is no numeric mastery score, because a percentage implies a precision a few dozen attempts cannot support — and because a number invites optimising the number.

### What moves a structure between states

Transitions should be driven by **accuracy over a recent window** (e.g. last 8 attempts), not by a single answer. A structure goes `PRACTISING → SOLID` on sustained accuracy across at least two separate sessions on different days — the two-session requirement is what stops a single good run from promoting something that was never retained overnight.

The `SOLID → SHAKY` demotion is the most important transition in the model and the one most tools omit. It's what makes the review queue mean something.

### The scheduling layer

Once a structure is `SOLID`, apply **FSRS at the structure level**, with the structure as the scheduled unit and a session's aggregate performance as the review grade. This keeps the good part of FSRS — a memory model that predicts when review is actually needed — without pretending a rule is a flashcard.

> **Confidence: medium.** FSRS is validated on flashcard review data, not on structure-level grammar performance. Applying it here is a reasonable extrapolation, not an evidenced practice. It should be treated as a starting heuristic that may need its parameters overridden, and this should be stated in the UI rather than presented as science.

### Two axes, not one

A single "mastery" number would conflate two things the evidence in [`01-evidence-base.md`](01-evidence-base.md) says come apart — accuracy and fluency. Interleaved practice improved accuracy while *worsening* fluency (more mid-clause pausing); blocked practice did the reverse. A model that tracks only accuracy will report progress while conversational fluency stalls.

Minimum viable version: record **response latency** alongside correctness. Even without a formal fluency score, "accurate but slow" versus "accurate and fast" is the difference between procedural and automatized knowledge, and it's free to capture.

## 3. What has to be stored

Small enough to matter:

```
attempt:  { structure_id, item_id, timestamp, correct, latency_ms, item_type }
structure:{ structure_id, state, state_since, due_at, fsrs_params }
```

An attempt log of one learner practising daily for a year is on the order of a few thousand rows — tens of KB of JSON. **This is not a database problem.** Which is most of the argument in [`05-architecture.md`](05-architecture.md).

The attempt log should be kept raw and complete rather than only its derived state, for one reason: **every parameter in this model is a guess** — the window size, the promotion threshold, the two-session rule. Keeping raw attempts means those can be re-tuned retroactively against real data. Storing only the derived state makes every early guess permanent.

## 4. What to show the learner

Progress display is where a model like this usually goes wrong, by presenting more certainty than it has.

- **Show the state, not a number.** "Participle clauses: solid, next review in 6 days."
- **Show coverage against the inventory** — how much of B2 and C1 has been touched at all. Against the current corpus that's an honest and motivating picture: eleven structures introduced, C1 largely unworked.
- **Show what's due**, and keep the due list short. A queue that grows unboundedly is the standard failure mode of every SRS tool and the reason people abandon them.
- **Don't show streaks.** They measure attendance, not learning, and they create pressure to do the minimum that preserves the streak.
- **Never show a single global "English level" number.** It would be the least defensible number in the system and the most likely to be believed.

## 5. Multi-learner, later

The decision recorded in the README is "me now, others later, structured for all levels." The model above is per-learner by construction: state lives in a keyed record, so a second learner is a second key. Nothing here needs redesigning for more learners — which is exactly why the architecture question in [`05-architecture.md`](05-architecture.md) can be deferred without cost.

The one thing that *would* change with many learners is that BKT becomes fittable and item difficulty becomes estimable from real response data. That's a reason to keep the raw attempt log, not a reason to build for it now.
