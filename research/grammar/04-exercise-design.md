# 04 — Exercise types, item authoring, and feedback

> **The question:** what should the learner actually *do* in this tool, where do the items come from, and what happens when they get one wrong?

**Short answer:** rank every candidate exercise by **transfer-appropriate processing** — how closely its cognitive demands resemble speaking — and the ranking inverts the usual order: sentence *production* from a meaning prompt beats transformation, which beats gap-fill, which beats multiple choice. Gap-fill isn't worthless, it's just the warm-up rather than the product. Items should come from **the article corpus first** — every article already contains a text written to embody one structure in natural context, which is the single most valuable asset here and the hardest thing to buy. Feedback should be **immediate, and should reformulate rather than restate the rule.**

---

## 1. The ranking

Judged against the criterion from [`01-evidence-base.md`](01-evidence-base.md) §3 — *practice transfers to the extent that its cognitive demands resemble use.*

| Rank | Type | What the learner does | Resembles speaking? | Cost to build |
|---|---|---|---|---|
| 1 | **Meaning-prompted production** | Given a situation, express it — "Say what you'd have done differently" | Closely: chooses meaning, then form | High (open response → needs judging) |
| 2 | **Sentence combining / reformulation** | Two simple sentences → one using the target structure | Partly: form choice under a meaning constraint | Medium |
| 3 | **Transformation** | Rewrite a given sentence in the target structure | Weakly: meaning is supplied | Low |
| 4 | **Error correction** | Find and fix the error | Weakly, and it's a *monitoring* skill | Low |
| 5 | **Gap-fill** | Supply the missing form | Barely: retrieval of a form, not expression of a meaning | Very low |
| 6 | **Multiple choice** | Pick the right form | No: recognition, and it teaches the wrong search | Very low |

Two things the ranking is *not* saying.

**It is not saying gap-fill is useless.** A 2024 *TESOL Quarterly* study on gap-fills for phrasal verbs found they support learning; the recent framing in the literature is that their effectiveness "depends on whether they're designed to simulate real-world language use rather than remaining as isolated mechanical drills." A gap-fill drawn from a context-rich paragraph, where the learner must understand the passage to choose correctly, is a different exercise from one over a disconnected sentence. **The context is the variable, not the format.**

**It is not saying multiple choice has no role.** It's cheap, machine-gradable, and fine for the `INTRODUCED` state where the goal is confirming the rule was understood. It just should never be what a `SOLID` judgement rests on.

### The structured-input exception

Processing instruction supplies one more type worth carving out: **structured input** — comprehension items where getting the meaning right *requires* processing the target form, with no production at all. ("*By the time the grid was upgraded, demand had already doubled.* — Which happened first?")

The meta-analytic finding is that PI beats production-based instruction for **receptive** knowledge but not for productive. So structured input is the right item type for a newly-`INTRODUCED` structure — cheap to author, machine-gradable, and it builds the form–meaning link that production practice then exploits. It is *not* a substitute for production, and the replication failures on complex targets are a reason not to lean on it too hard.

## 2. Where items come from

### The asset that already exists

Reading `site/content/` and `lib/articles.js`: every article carries `grammar_focus` in its front matter, a `## Grammar Spotlight` section with the rule and 1–2 worked example pairs, and a ~500-word text **written so that the target structure occurs naturally in it, unmarked**. `splitSections()` in `lib/articles.js` already parses these into named sections (`grammar-spotlight` is derived from the part of the heading before the colon, so it's stable across articles).

That is a corpus of **naturally-occurring, level-appropriate, topically-coherent exemplars of specific grammatical structures, written for this exact learner.** Nothing purchasable is as well fitted. Two consequences:

- **Items should be derived from article sentences wherever possible**, not written from scratch. A transformation item whose source sentence the learner read in a class about ocean carbon sinks carries context, meaning, and a memory hook that a textbook sentence about John's brother does not.
- **The unmarked-form rule is load-bearing.** [`01-evidence-base.md`](01-evidence-base.md) §6 found textual enhancement is worth about d = 0.22 and may disrupt comprehension, so `docs/class-structure.md`'s existing rule against bolding is correct — but it means locating target structures in the text requires parsing, not a lookup. That's a real implementation cost, and it's worth paying.

The limit is quantity: **11 articles, one per structure** (see [`02-cefr-inventory.md`](02-cefr-inventory.md) §3). One text per structure is a thin base for repeated practice. So corpus-derived items are the *highest-quality* source, not a sufficient one.

### Options for the rest

| Source | Quality | Cost | Verdict |
|---|---|---|---|
| Hand-authored bank | Highest control | Very high per item | Only for structures with no article |
| Derived from articles | Highest relevance | Medium (parsing) | **Primary source** |
| LLM-generated at build time, human-reviewed | Good, variable | Low per item, needs review | **Scaling source** |
| LLM-generated at runtime | Unbounded variety | Unpredictable quality, cost, needs a server | Not now |
| Published exercise banks | Variable | Licensing problems | No |

On LLM generation: there is active research on it, including a 2026 study evaluating LLM-generated EFL grammar drills specifically for question type, cognitive load and CEFR alignment, and earlier work on example-aware gap-fill generation from partially annotated data. The honest summary is that generation is feasible and quality is the open question — **CEFR alignment in particular is not something a generator can be trusted to self-report.** Generated items should be built at build time and reviewed, never served unseen.

> **Confidence: medium-low** on LLM item quality. This is a fast-moving area, the literature is thin and recent, and I have not evaluated any generator against this corpus. Treat "generate and review" as a plan to be tested, not a solved step.

### The problem with open responses

The top-ranked item type produces free text, which cannot be graded by string comparison. Three options, in increasing cost:

1. **Self-assessment** — show a model answer, learner marks themselves. Crude, but it's what a paper workbook does, it costs nothing, and it preserves the production practice, which is the part that matters. Latency is still measurable.
2. **Constrained production** — design prompts with a small set of acceptable answers, accept any of them. Keeps machine grading, loses some openness.
3. **LLM grading** — needs a server and a per-request cost, and introduces a failure mode where a *correct* answer is marked wrong, which is worse than no grading.

**Recommendation: start with self-assessment.** It is the only option that gets production practice into the tool at zero infrastructure cost, and the evidence says the production is where the value is — not the scoring. This is also the finding that most weakens the case for a backend (see [`05-architecture.md`](05-architecture.md)).

## 3. Feedback

From [`01-evidence-base.md`](01-evidence-base.md) §4: corrective feedback has a medium overall effect (d = 0.64) that holds over time; **implicit feedback is better maintained** than explicit; and the timing review favours **immediate** in half the studies with most of the rest finding no difference.

Design rules that follow:

- **Immediate.** Feedback at the moment of the attempt, not at the end of a set.
- **Reformulate first, explain second.** Show the corrected sentence — *"If the grid had been upgraded, we wouldn't be short now"* — before restating the rule. Implicit-style feedback retains better; the rule restatement is a fallback the learner can expand if they want it.
- **Link to the source.** Where the item came from an article, show the original sentence in its paragraph. This is nearly free (`splitSections()` already has the sections) and turns feedback into a return to meaningful context.
- **Don't score a session.** A percentage at the end invites optimising the percentage. Report what moved state and what's due next.
- **Log the error, don't just correct it.** A repeated confusion between two structures is the signal that should drive interleaving — see `confusable_with` in [`02-cefr-inventory.md`](02-cefr-inventory.md) §4.

### Errors during practice

Worth flagging because it cuts against instinct: the 2024 TESOL Quarterly gap-fill study asks directly whether errors help or hinder learning. The broader retrieval-practice literature is consistent that **retrieval attempts followed by feedback beat restudying**, including attempts that fail. Practically: don't design the tool to prevent wrong answers. An item too easy to get wrong isn't teaching. What matters is that the wrong answer is immediately followed by the right one.

## 4. A session shape

Putting §1–§3 together with the scheduling conclusion from [`03-progress-model.md`](03-progress-model.md):

| Phase | Content | Why |
|---|---|---|
| Warm-up (2 min) | 3–4 items on `SOLID`/`MAINTAINED` structures that are due | Spaced retrieval; also gets an easy win first |
| Focus (6 min) | One structure in `PRACTISING`/`SHAKY`, **blocked** — structured input, then transformation, then production | Blocked practice favours fluency; the sequence follows declarative→procedural |
| Mixed (4 min) | Items across several structures, including `confusable_with` pairs | Interleaving favours accuracy |
| Close | What moved state, what's due next | No score |

Roughly 12 minutes, which is deliberate: it is **separate from the 30-minute class budget** in `docs/class-structure.md`, not inside it. The class is where conversation happens; this is what makes the structures practised in class stick between classes. If the tool ever needs a slot in the class itself, it competes with the discussion time that is the whole point.

## 5. What this rules out

- **A quiz app.** Multiple choice ranks last on the only criterion that matters here.
- **Gamified streaks and points.** See [`03-progress-model.md`](03-progress-model.md) §4 — they measure attendance.
- **Auto-generated items served unreviewed.** CEFR alignment can't be self-certified by the generator.
- **Bolding the target form in article texts.** d = 0.22, plus a comprehension cost, against an existing project rule that is already correct.
