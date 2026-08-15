# Dictionary integration research

**Date:** 2026-08-11
**Question:** how to add word lookup to the English Learning site, given it's Next.js `output: "export"` today and may become a server-based + SPA Next app.

**Decisions taken (2026-08-11):**

- **Interaction:** the reader *selects* a word or phrase, then checks it in the dictionary.
- **Saved words / history / sync:** not wanted. Lookup is read-only.
- **Migration:** both architectures costed, decision deferred.
- **Priorities:** zero cost + no rate limits, and best definition quality.

**Decisions added after review (see [`research-considerations.md`](research-considerations.md)):**

- **Scope:** hybrid — embedded dictionary **+** API **+** cache. Article-scoped coverage is too limiting because a **dictionary tab on the search page** is wanted.
- **API:** freedictionaryapi.com.
- **Build phase:** may run locally rather than on the server; a pipeline step later is fine.
- **Lemmatization:** confirmed necessary.
- **UI (settled 2026-08-11):** full-width panel on **all** devices, pinned opposite the selection with hysteresis; two-step "Define" button; **no auto-focus** — tab order + keyboard shortcut (`d`) + `aria-live` instead. Spec in [`04-selection-ui.md`](04-selection-ui.md) §2a.
- **Merriam-Webster:** ❌ removed — their terms forbid the caching this design depends on.

**Final decisions (2026-08-11) — research closed, ready to implement:**

- **Search-page dictionary tab:** ships in **v1**.
- **Shipping corpus: Wiktextract (kaikki.org English).** WordNet is **scaffolding, not the v1 corpus** — its 40-line parser in [`prototype/`](prototype/) gives working data in an hour to build the UI against, while the Wiktextract ingest runs as a parallel workstream and swaps in before release.
- **Audio:** `speechSynthesis` only in Phase 1. Zero bytes, zero attribution burden, complete coverage.
- **Licensing:** articles stay all-rights-reserved; a separate `LICENSE` in the dictionary-data folder names CC BY-SA 4.0. Site-side attribution goes in the existing footer (already `data-pagefind-ignore`). Obligations in [`07-caching-and-licensing.md`](07-caching-and-licensing.md) §3.
- **Deferred by design:** shard granularity — measure once the corpus is built rather than guessing.

> ### ⚠️ The corpus decision was reversed, twice — read this before implementing
>
> The honest history, because the churn is itself informative:
>
> 1. **WordNet as the base layer** — correct when the dictionary was article-scoped and the search tab was a later phase.
> 2. **WordNet first, Wiktextract later**, with the search tab made API-first to compensate. A patch over a corpus that no longer fitted the scope.
> 3. **Wiktextract as the v1 corpus, WordNet as scaffolding** ← current.
>
> What changed: once the **search tab moved into v1**, the dictionary stopped being a
> background layer and became a browsable product surface. At that point WordNet's
> terseness, missing IPA and 2006 vocabulary cutoff stop being invisible, and the
> API-first workaround puts your *primary* dictionary experience on a single-operator
> free API. Building on WordNet then rebuilding on Wiktextract also means writing the
> ingest pipeline twice.
>
> Reasoning in [`06-lookup-scope.md`](06-lookup-scope.md) §3 and §7. **If the search tab
> slips out of v1, decision 2 becomes correct again** — the trigger is scope, not
> anything about the corpora themselves.

---

## Contents

| File | What's in it |
|---|---|
| [`01-architecture-fit.md`](01-architecture-fit.md) | **Start here for rationale.** How this fits Next.js 16 static export, what the migration would buy and cost, and the codebase-specific gotchas |
| [`02-api-options.md`](02-api-options.md) | Every dictionary API worth considering — limits, pricing, licensing, quality |
| [`03-embedded-options.md`](03-embedded-options.md) | Embedding a dictionary with no third-party API. Four architectures, with measured sizes |
| [`04-selection-ui.md`](04-selection-ui.md) | Selection-based lookup: interaction design, lemmatization, audio, IPA |
| [`05-implementation-plan.md`](05-implementation-plan.md) | ⭐ **The plan.** Self-contained: every decision, phased, against the real files in `site/` |
| [`06-lookup-scope.md`](06-lookup-scope.md) | How big the dictionary should be: the hybrid, the search-page tab, and multiword expressions |
| [`07-caching-and-licensing.md`](07-caching-and-licensing.md) | Committing definitions to the repo, and what attribution each source actually requires |
| [`08-sources.md`](08-sources.md) | Full reference list with per-claim confidence |
| [`prototype/`](prototype/) | Node scripts producing the measured numbers in `03` and `06`. `lib/wordnet.mjs` seeds the real build script |
| [`research-considerations.md`](research-considerations.md) | The review questions that produced docs `06`–`07` |
| [`doublecheck-report.md`](doublecheck-report.md) | ✅ Licensing verification pass + **the open questions to settle before implementation**. Temporary — delete when coding starts |

---

## The answer in one page

### Static export is not the constraint it looks like

"Static export can't use keyed APIs" is true only **at runtime**. At **build time** a build script can read a key from `process.env`, call the API, and bake the result into static output — the key never reaches the browser.

Since your vocabulary is a **finite, slowly-growing set** (~4,000–6,000 lemmas across the corpus, +~50 per article), build time is where those calls belong anyway. A 1,000-requests/day API cap stops being a runtime constraint and becomes a one-time backfill.

**Nothing this feature needs is blocked by `output: "export"`.**

### But technically possible is not the same as permitted

⚠️ **Correction (2026-08-11).** The original plan batch-fetched Merriam-Webster at build time and committed the cache. Their [ToS clause 5(a)](https://dictionaryapi.com/info/terms-of-service) forbids *"automated or recorded queries"* without written approval. **I checked their FAQ but not their terms, and built a plan on the gap.** Merriam-Webster is out.

Only openly-licensed sources can be cached and committed: **Wiktionary/wiktextract (CC BY-SA 4.0)** and **WordNet (Princeton licence)**. Conveniently, those are the ones worth embedding anyway. See [`07-caching-and-licensing.md`](07-caching-and-licensing.md).

### Multiword lookup needs no enumeration

Storing every word combination in your articles would be absurd — and it's unnecessary. **WordNet already ships 64,246 multiword headwords (43% of the dictionary)**; Wiktionary has more. You match a selection against the dictionary's existing phrase inventory, longest span first, then fall back to the head word. Storage is bounded by the dictionary, not by your corpus. See [`06-lookup-scope.md`](06-lookup-scope.md) §2.

### WordNet is the right fallback but the wrong base for a browsable dictionary

It was recommended as a safety net, where its terseness is fine. As the base of a **search-page dictionary tab** it becomes the primary text a learner reads — and it has no IPA, no audio, and has been frozen since 2006.

Measured: WordNet has no entry for **`carbon sink`** or **`carbon footprint`**. `carbon sink` is in the title of one of your published articles. Wiktionary has both, with good definitions. **Wiktextract data is the better base layer, and it's the same data your chosen API already serves** — so the API's advantage is convenience, not quality.

Use WordNet as **scaffolding** — `npm i` plus a 40-line parser gives real data in an hour to build the panel, sharding and lemmatization against. Ship on Wiktextract.

### Wiktextract's difficulty is curation, not parsing

Worth being precise, because this was overstated earlier. Parsing the dumps is a streaming JSONL filter, roughly a hundred lines. The real work is that kaikki lists **1,385,953 English word forms**, including braille characters, emoji, `α-Methylfentanyl`, `い-adjective` and vast numbers of pure inflections. **WordNet's genuine value is that it is pre-curated** — 147,982 headwords chosen by lexicographers.

Two things make that tractable: mechanical filters (content POS, drop obsolete/archaic, drop pure inflections, cap at 4 tokens) do most of it — and **Wiktextract hands you the lemmatization map for free**, verified in a live response: `"forms":[{"word":"carbon sinks","tags":["plural"]}]`. That's the surface-form→headword map [`04-selection-ui.md`](04-selection-ui.md) §3 requires, which with WordNet you'd generate yourself.

⚠️ The filtered result size is **reasoned, not measured** — it needs the 3 GB dump.

### The migration path costs one line

Serve the dictionary data through a Route Handler:

```js
// site/app/dictionary/[shard]/route.js
export const dynamic = "force-static";   // ← delete this line after migrating
```

On static export it emits `/dictionary/a.json` at build time. Drop `output: "export"` later and the *same file* becomes a live API route at the same URL. **Client code never changes.**

### Should you migrate?

For a read-only, selection-triggered dictionary with no saved words: **no.** It buys essentially nothing and costs latency plus a runtime failure mode. A function call for a definition is strictly slower than an in-memory lookup.

Two things would change that — cross-device saved words, or per-learner adaptive vocabulary. Neither is on the roadmap, and you've explicitly declined the first. Full costing in [`01-architecture-fit.md`](01-architecture-fit.md) §4.

Worth separating the two axes: **"evolve to SPA" needs no migration at all** — client-side navigation and client data fetching already work on static export. Only "evolve to server" does.

### The thing the original research missed

Every article already has a hand-written `## Key Vocabulary` section:

> - **strain** — pressure that risks causing damage or failure. *The heatwave put enormous strain on the grid.*

That's a curated, context-specific gloss with an example, pitched at this reader, about this text — **better than anything Merriam-Webster, Wiktionary or WordNet returns for those words**. `splitSections()` in `lib/articles.js` already parses it out. Making it the highest-priority source in the popover is nearly free and is the single biggest quality win available.

### Recommended build

**Build-time pipeline → static JSON shards → client-side selection popover.**

| Layer | Source |
|---|---|
| 1st | The article's own `## Key Vocabulary` gloss |
| 2nd | Merriam-Webster Learner's — optional, best learner definitions, needs a key + logo |
| 3rd | freedictionaryapi.com — free, no key, IPA + examples + synonyms |
| 4th | WordNet, embedded — always works, offline, no network |

Zero runtime API calls · zero secrets in the client · no rate limits · works offline · **~150–300 KB gzipped**.

### Why selection-based lookup fits this codebase

The article body is injected with `dangerouslySetInnerHTML`, so it's opaque to React — per-word click targets would need every word wrapped in a `<span>` at build time, bloating the HTML and polluting the Pagefind index. Selection needs **one listener** on `.article-body` and **zero DOM changes**. It also handles multiword expressions naturally, which matters for articles dense with phrases like "carbon sink" and "power hunger".

---

## Measured basis

Prototype run 2026-08-11 against `wordnet-db@3.1.14` — full detail in [`03-embedded-options.md`](03-embedded-options.md):

| Build | Headwords | Raw | gzip | brotli |
|---|---|---|---|---|
| Full WordNet | 147,982 | 22.4 MB | 4.8 MB | — |
| Single-word, ≤3 senses | 83,736 | 12.1 MB | 2.9 MB | **2.1 MB** |
| Per-letter shards | 83,736 | — | — | **~102 KB/shard** |
| **Scoped to article vocabulary** | ~4–6k | — | **~150–300 KB** | — |

Reproduce with [`prototype/`](prototype/).
