# Dictionary integration research

**Date:** 2026-08-11
**Question:** how to add word lookup to the English Learning site, given it's Next.js `output: "export"` today and may become a server-based + SPA Next app.

**Decisions taken (2026-08-11):**

- **Interaction:** the reader *selects* a word or phrase, then checks it in the dictionary.
- **Saved words / history / sync:** not wanted. Lookup is read-only.
- **Migration:** both architectures costed, decision deferred.
- **Priorities:** zero cost + no rate limits, and best definition quality.

---

## Contents

| File | What's in it |
|---|---|
| [`01-architecture-fit.md`](01-architecture-fit.md) | ⭐ **Start here.** How this fits Next.js 16 static export, what the migration would buy and cost, and the codebase-specific gotchas |
| [`02-api-options.md`](02-api-options.md) | Every dictionary API worth considering — limits, pricing, licensing, quality |
| [`03-embedded-options.md`](03-embedded-options.md) | Embedding a dictionary with no third-party API. Four architectures, with measured sizes |
| [`04-selection-ui.md`](04-selection-ui.md) | Selection-based lookup: interaction design, lemmatization, audio, IPA |
| [`05-implementation-plan.md`](05-implementation-plan.md) | Phased plan against the real files in `site/` |
| [`06-sources.md`](06-sources.md) | Full reference list with per-claim confidence |
| [`prototype/`](prototype/) | Working scripts that produced the measured numbers in `03` |

---

## The answer in one page

### Static export is not the constraint it looks like

"Static export can't use keyed APIs" is true only **at runtime**. At **build time** every keyed API is available — a build script reads `process.env.MW_KEY`, calls the API, and bakes the result into static output. The key never reaches the browser.

Since your vocabulary is a **finite, slowly-growing set** (~4,000–6,000 lemmas across the corpus, +~50 per article), build time is where those calls belong anyway. A 1,000-requests/day API cap stops being a runtime constraint and becomes a one-time backfill.

**Nothing this feature needs is blocked by `output: "export"`.**

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
| Full WordNet | 147,982 | 22.4 MB | 4.9 MB | — |
| Single-word, ≤3 senses | 83,736 | 12.1 MB | 2.9 MB | **2.1 MB** |
| Per-letter shards | 83,736 | — | — | **~102 KB/shard** |
| **Scoped to article vocabulary** | ~4–6k | — | **~150–300 KB** | — |

Reproduce with [`prototype/`](prototype/).
