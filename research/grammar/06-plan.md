# 06 — A phased plan

> **The question:** given docs 01–05, what's the smallest first thing worth building, and in what order does the rest follow?

**Short answer:** the first phase writes **no interactive code at all**. It builds the grammar inventory as data and wires it to the article corpus — which immediately solves a problem that already exists (the grammar rotation in `docs/class-structure.md` is exhausted) and is a prerequisite for everything else. Practice comes second, scheduling third.

---

## Phase 0 — Verify the inventory

**Deliverable:** the table in [`02-cefr-inventory.md`](02-cefr-inventory.md) §2, checked against the published sources.

**Half of this is already done.** The table was checked against the **Core Inventory PDF** on 2026-08-12 and the disagreements are recorded in [`02-cefr-inventory.md`](02-cefr-inventory.md) §2.1 — CIGE places third conditionals and modal perfects a level *earlier*, used-to/would a level *later*, spreads passives and phrasal verbs across more levels than the table does, files concessive clauses under discourse markers at C1, and omits cleft sentences and participle clauses entirely.

What remains:

- **C1 and C2 rows checked against EGP online** — which requires a real browser, since the page is client-rendered and returns an empty body to a plain fetch.
- **Cleft sentences and participle clauses need a source.** Two of the eleven existing articles teach structures CIGE doesn't list at any level. Their level assignments currently rest on convention alone.
- **Disagreements recorded rather than resolved.** Both levels go in the data with their source, per the `level_source` field. Given that EGP's advanced-level assignments are its least statistically verified part, a single authoritative level at B2–C1 would be false precision.
- **Licence check** on reuse of either inventory in a derived, published dataset. Neither publishes an obvious open-data licence. Confidence that a machine-readable EGP export can be obtained legitimately is low; assume a hand-built synthesis is required.

**Effort:** a couple of hours of reading in a browser. **Blocking:** everything else.

## Phase 1 — The inventory as data

**Deliverable:** `site/content/grammar-inventory.json`, plus a coverage view.

Schema per [`02-cefr-inventory.md`](02-cefr-inventory.md) §4: `id`, `name`, `level`, `level_source`, `function`, `prerequisites`, `articles`, `confusable_with`.

The `articles` field is populated by matching each article's `grammar_focus` front-matter value to a structure `id`. That match is currently by free text — eleven articles, eleven distinct hand-typed values — so Phase 1 includes **normalising `grammar_focus` to inventory ids**, and adding a check to `scripts/verify.mjs` that every article's `grammar_focus` resolves to a real structure. That's the same class of check `check-content.mjs` already performs on front-matter asset paths, in the same place.

**What this delivers on its own, before any practice tool exists:**

- **The rotation problem is solved.** `docs/class-structure.md` records eleven grammar points and every one now has an article. "What grammar point next?" becomes a query over structures with no article, ordered by level and prerequisites.
- **The coverage gap becomes visible.** Two of eleven articles cover C1 structures; C1 has substantial unworked territory (reduced relatives, nominalisation, unreal past, passive reporting structures, fronting, emphatic *do*).
- **The `english-learning-article` skill gets a better input.** Instead of "pick the next point in the rotation," it can be told which structure is next and why.

**This phase is worth doing even if the practice tool is never built.** That's the test of whether it's the right first phase.

## Phase 2 — Items from the corpus

**Deliverable:** a build-time generator producing `items.json` from article texts.

Start with the two lowest-cost, highest-evidence types from [`04-exercise-design.md`](04-exercise-design.md):

- **Structured input** items (comprehension requiring the target form) — the right type for a newly-introduced structure, machine-gradable.
- **Transformation** items derived from real article sentences.

The hard part is **locating target structures in article text**, which is genuinely hard precisely because the project's rule against bolding is correct ([`01-evidence-base.md`](01-evidence-base.md) §6). Options, cheapest first: use the `## Grammar Spotlight` worked examples (already parsed by `splitSections()`, guaranteed to contain the structure, but only 1–2 per article); pattern-match the article body per structure; or run a parser. **Start with the Spotlight examples** — they're free and reliable — and only add body extraction if item volume proves insufficient.

Generated items are **reviewed before shipping**, per [`04-exercise-design.md`](04-exercise-design.md) §2. A generation step that emits items into a file which a human edits and commits fits the existing build pipeline and keeps the review step honest.

## Phase 3 — The practice session

**Deliverable:** a client-side practice view, `localStorage`-backed, with export/import.

- Session shape per [`04-exercise-design.md`](04-exercise-design.md) §4: warm-up, blocked focus, mixed close. ~12 minutes, **outside** the 30-minute class budget.
- Immediate feedback, reformulation before rule restatement, link back to the source article paragraph.
- Append-only versioned attempt log; export/import from day one, not deferred.
- Add **meaning-prompted production with self-assessment** here rather than later — it's the top-ranked type on transfer-appropriate processing and the cheapest version of it costs a model answer and a self-mark.

At this phase progress display is deliberately minimal: which structures have been practised, what state they're in. No scheduling yet.

## Phase 4 — Scheduling

**Deliverable:** mastery states and the FSRS layer.

Left until last on purpose. The state machine in [`03-progress-model.md`](03-progress-model.md) §2 has several guessed parameters — window size, promotion threshold, the two-session rule — and **guessing them against a real attempt log beats guessing them against nothing.** Phases 2–3 generate that log. Building the scheduler first would mean tuning it blind.

The massed-then-spaced rule is the part to get right, and it's the part a stock SRS library won't give you: concentrate practice while a structure is `PRACTISING`, hand it to FSRS once it's `SOLID`.

## Phase 5 — Below B2, and other learners

Only if wanted. The inventory is built A1–C2 from Phase 0, so lower levels need content, not redesign — and processability constraints ([`01-evidence-base.md`](01-evidence-base.md) §7) start to matter below B1 in a way they don't at B2–C1. Multiple learners need a key per learner and, if cross-device, the architecture triggers in [`05-architecture.md`](05-architecture.md) §3.

---

## Sequencing rationale

| Phase | Delivers value alone? | Unblocks |
|---|---|---|
| 0 Verify inventory | Yes — a defensible level map | Everything |
| 1 Inventory as data | **Yes — fixes the exhausted rotation** | 2, 3, 4 |
| 2 Items from corpus | Partly — reusable in class | 3 |
| 3 Practice session | Yes — the actual tool | 4 |
| 4 Scheduling | Yes — retention | 5 |
| 5 Other levels/learners | Optional | — |

Each phase ships something usable, and the order puts the phase with the highest value-to-effort ratio first — Phase 1 is a JSON file and a verify check, and it retires a decision the project currently makes by hand every time an article is written.

## What is deliberately not in this plan

- **A backend.** Deferred with explicit triggers, per [`05-architecture.md`](05-architecture.md) §3.
- **LLM grading.** Rejected on evidence grounds; revisit only if self-assessment demonstrably fails.
- **Knowledge tracing.** Unfittable at this scale.
- **Anything inside the 30-minute class.** The class is for conversation; this tool is for between classes.
