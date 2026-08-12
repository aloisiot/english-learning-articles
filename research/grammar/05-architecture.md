# 05 — Architecture, costed both ways

> **The question:** does this feature need a server, or does it fit the existing `output: "export"` static site? Both were to be costed — but as a *consequence* of the pedagogy decisions, not as a technology preference.

**Short answer:** the pedagogy decides it, and it decides for **static**. Every feature that would need a server was ruled out on evidence grounds before the architecture question arose: LLM grading was rejected in favour of self-assessment, runtime item generation was rejected in favour of build-time generation with review, and knowledge tracing was rejected as unfittable on one learner's data. What remains is a few thousand JSON rows and an FSRS calculation — which runs in the browser. The one thing a server genuinely buys is **cross-device progress**, and that is a convenience, not a pedagogical requirement.

---

## 1. Working backwards from the pedagogy

This is the honest order of reasoning, and it's worth writing down because reversing it produces the opposite answer.

| Decision from docs 01–04 | Where it was made | Server needed? |
|---|---|---|
| Items derived from the article corpus | [`04`](04-exercise-design.md) §2 — highest relevance | No — build time |
| Generated items reviewed before shipping | [`04`](04-exercise-design.md) §2 — CEFR alignment can't be self-certified | No — build time |
| Open production graded by self-assessment | [`04`](04-exercise-design.md) §2 — the production is the value, not the scoring | No |
| No knowledge tracing | [`03`](03-progress-model.md) §1 — unfittable at n=1 | No |
| Mastery states + FSRS scheduling | [`03`](03-progress-model.md) §2 | No — arithmetic |
| Immediate feedback, reformulation | [`04`](04-exercise-design.md) §3 | No |
| Raw attempt log retained | [`03`](03-progress-model.md) §3 — so parameters can be re-tuned | No — tens of KB |

Nothing in the recommended design has a runtime dependency. That isn't a coincidence, and it isn't a static-first bias smuggled in: **the pedagogical arguments each independently favoured the cheaper option.** Self-assessment won because production practice matters more than scoring accuracy. Build-time generation won because unreviewed items can't be trusted. Neither argument mentions hosting.

## 2. Option A — inside the static site

The same shape as the dictionary strand's recommendation, and for the same reason: a build-time pipeline feeding a client-side interaction.

```
Build time                          Runtime (browser)
──────────                          ─────────────────
content/*.md                        localStorage
  ├─ grammar_focus  ─┐                ├─ attempt log
  └─ article text ───┼─► items.json ──┼─► FSRS scheduler
inventory.json ──────┘                └─ mastery states
  (structures, levels,
   prerequisites)
```

**What it costs:** nothing. No hosting change, no secrets, no runtime failure mode, works offline, deploys through the existing Vercel/GitHub path and the existing `npm run verify` gate.

**What it gives up:** progress lives in one browser on one device. Clearing site data loses it.

**Existing precedent in the repo:** `scripts/download-covers.mjs` already does build-time enrichment; `scripts/postbuild.mjs` already runs a generator over built output; `scripts/verify.mjs` already gates on content checks. An item-generation step and an inventory-coverage check are the same shape as things that exist.

**The mitigation for the one real weakness** is export/import — a button that writes the attempt log to a JSON file and reads one back. That is perhaps thirty lines, it makes the data portable, and it turns "you'll lose your progress" into "back it up occasionally." It also preserves the raw log across a browser change, which [`03`](03-progress-model.md) §3 argued matters for re-tuning parameters later.

## 3. Option B — with a backend

Costed at the same level of detail, because the point of the exercise is that someone could reasonably choose it.

**What it buys:**

| Capability | Value here |
|---|---|
| Cross-device progress | Real, and the only genuinely missing capability |
| Multiple learners with accounts | Only if the tool is ever shared |
| LLM grading of open production | Rejected on evidence grounds in [`04`](04-exercise-design.md) §2 |
| Runtime item generation | Rejected in [`04`](04-exercise-design.md) §2 |
| Aggregate analytics across learners | Would make BKT fittable — but needs many learners |

**What it costs:**

- Dropping `output: "export"` — the site becomes a running service with a runtime failure mode where today there is none.
- Auth, which for one user is pure overhead, and for a handful is still the single most expensive component of the whole feature.
- A database, storing a few thousand rows.
- Per-request latency where there is currently in-memory access.
- Ongoing cost and maintenance where there is currently neither.

**What would flip the decision.** Stated plainly so this document stays useful:

1. **The tool is genuinely shared with other learners**, each needing their own progress — the "others later" case. Note this needs *accounts*, not just a server.
2. **Cross-device becomes a real friction**, e.g. practising on a phone and reviewing on a laptop, often enough that export/import is annoying rather than adequate.
3. **The self-assessment compromise proves inadequate in practice** and LLM grading of open production becomes worth its failure modes.

Trigger 3 is the interesting one because it's an *empirical* question the static version can answer. Ship self-assessment, use it, see whether the grading gap actually hurts. That is much better evidence than reasoning about it now.

## 4. The recommendation

**Build it static. Add export/import. Revisit if any of the three triggers fires.**

Two supporting points, both from the dictionary strand's `01-architecture-fit.md` and both still true:

- **"Evolve to SPA" needs no migration at all.** Client-side navigation and client-side state already work under static export. A grammar practice session is a client-side interactive view; that is squarely within what the current setup supports.
- **The migration path is cheap if it ever comes.** Serving progress data through a Route Handler with `export const dynamic = "force-static"` emits a static file today and becomes a live API route at the same URL when the line is deleted, with no client change. The same trick applies here — if progress ever needs to be server-persisted, the read path can be written once in a form that survives the change.

Consistency matters too: the dictionary research reached "static, build-time pipeline, client-side interaction" for a read-only lookup feature. This strand reaches the same conclusion from a completely different starting point — a *stateful* feature with per-learner data. Two independent analyses converging is worth something.

## 5. Where the state actually lives

One detail worth settling now because it's easy to get wrong and expensive to change.

`localStorage` is the right store: it survives reloads and restarts, it's synchronous, and the data volume is trivial. But it is **origin-scoped and clearable**, so it must be treated as a cache of something the user can also hold, not as the only copy. Hence export/import — and hence the rule that the **raw attempt log** is what gets exported, not the derived state. Derived state can always be recomputed from attempts; attempts cannot be recovered from derived state.

Store the log **append-only**, with a schema version field on the file. Every parameter in the progress model is a guess ([`03`](03-progress-model.md) §3), and an append-only versioned log is what makes those guesses revisable rather than permanent.

> Note: `docs/` in this repo records the artifact-authoring conventions and the site's build pipeline. If this recommendation is adopted, the storage decision and the export/import contract belong in `docs/`, not only here — this file records *why*, `docs/` records *what we do*.
