# 05 — Implementation plan

> **The question:** what exactly gets built, in what order, against the real files in `site/`?

**Short answer:** a **build-time pipeline that turns Wiktextract data into sharded static JSON**, consumed by a **client-side selection popover** and a **search-page dictionary tab**. No runtime API calls on the happy path, no secrets, no rate limits, works offline, and nothing requires dropping `output: "export"`.

**This document is self-contained.** It summarises every decision the strand reached; the other docs hold the reasoning. If you only read one file before implementing, read this one.

---

## 1. What's being built

Two surfaces over one dataset:

| Surface | Interaction | Where |
|---|---|---|
| **Article lookup** | Reader selects a word or phrase → "Define" button → panel | `site/app/articles/[slug]/` |
| **Dictionary tab** | Reader types a word → autocomplete → entry | `site/app/search/` |

Both ship in **v1**.

## 2. The decisions, in one table

| Decision | Choice | Why / where |
|---|---|---|
| **Interaction** | Selection-based, not per-word click targets | Article body is `dangerouslySetInnerHTML` — per-word targets would need every word wrapped in a `<span>`, bloating HTML and polluting Pagefind. [`04`](04-selection-ui.md) §1 |
| **Shipping corpus** | **Wiktextract (kaikki.org English)** | IPA, examples, modern vocabulary, multiword entries, and it's the same data freedictionaryapi.com serves. [`06`](06-lookup-scope.md) §3 |
| **WordNet** | **Scaffolding only** — build the UI against it while Wiktextract ingest runs in parallel | Parser already exists in [`prototype/`](prototype/). Throwaway, not lost investment |
| **API** | freedictionaryapi.com, as **long-tail fallback only** | Not the primary source. Bulk data comes from kaikki dumps, not the API. [`07`](07-caching-and-licensing.md) §2 |
| **Merriam-Webster** | ❌ **Excluded** | [ToS clause 5(a)](https://dictionaryapi.com/info/terms-of-service) forbids automated/recorded queries. [`07`](07-caching-and-licensing.md) §1 |
| **Saved words / history** | ❌ Not built. Lookup is read-only | User decision. Removes the only real argument for a backend |
| **Audio** | `speechSynthesis` only in Phase 1 | Zero bytes, zero attribution burden, total coverage. [`04`](04-selection-ui.md) §4 |
| **Architecture** | Static export retained | Nothing here needs a server. [`01`](01-architecture-fit.md) §4 |
| **Data serving** | `force-static` Route Handler | Same file works before and after a server migration. [`01`](01-architecture-fit.md) §3 |
| **Licensing** | Articles reserved; dictionary data CC BY-SA 4.0 in its own folder | [`07`](07-caching-and-licensing.md) §3 |
| **Shard granularity** | Deferred — measure once the corpus is built | Single-letter measured at ~102 KB on WordNet; Wiktextract may need two-letter |

## 3. Architecture

```
BUILD TIME  (local or CI — never in the browser)

  kaikki.org English Wiktextract dump
        │  streaming JSONL filter  ── scripts/build-dictionary.mjs
        │    · content POS only; drop obsolete/archaic/rare
        │    · drop pure inflections → these BECOME the forms map
        │    · cap headwords at 4 tokens; ASCII-ish
        │    · keep: definition, ≤1 example, IPA (RP + GenAm), forms
        ↓
  site/data/dictionary/            ← committed, CC BY-SA 4.0 + LICENSE
    entries/<shard>.json                 headword → senses
    forms.json                           surface form → headword
    headwords.json                       autocomplete index, no definitions
    key-vocabulary.json                  parsed from each article's ## Key Vocabulary
        ↓
  app/dictionary/[shard]/route.js  (force-static)  ──►  static JSON at build

RUNTIME  (browser — no API on the happy path, no secrets)

  .article-body ──selection──► capture string → lemmatize → shard fetch → panel
  /search (dictionary tab) ──► headwords.json → shard fetch → entry

  Resolution order, both surfaces:
    1. article's ## Key Vocabulary   (article lookup only — best quality)
    2. embedded Wiktionary entry
    3. freedictionaryapi.com, live   (misses only; words postdating the build)
    4. "No entry" + link to Wiktionary
```

**Why this shape:** zero runtime API calls for anything in the corpus, no secrets in the client, works offline, no rate limit to exhaust, and identical before and after a server migration.

---

## 4. Phase 1 — Scaffold the UI (WordNet)

Goal: a working end-to-end interaction in hours, so UX iteration doesn't wait on the ingest pipeline.

| # | Task | File |
|---|---|---|
| 1 | Lift `prototype/lib/wordnet.mjs` into the site as the first corpus adapter | `site/scripts/build-dictionary.mjs` |
| 2 | Emit shards + `forms.json` + `headwords.json` behind a **corpus-agnostic interface**, so swapping the input doesn't touch anything downstream | same |
| 3 | Serve shards via a `force-static` Route Handler | `site/app/dictionary/[shard]/route.js` |
| 4 | Selection listener + panel (spec in §6) | `site/app/dictionary-panel.js` (Client Component) |
| 5 | Mount around the article body | `site/app/articles/[slug]/page.js` |
| 6 | Dictionary tab with autocomplete off `headwords.json` | `site/app/search/` |
| 7 | Audio via `speechSynthesis` | panel component |
| 8 | Wire the build in **before** `next build` (Pagefind runs after) | `site/package.json` |

**Critical in step 2:** the corpus adapter is the only WordNet-aware code. Everything else — sharding, serving, lookup, UI — must be written against the emitted format, not the corpus. That's what makes Phase 2 a swap rather than a rewrite.

**Expected size on WordNet:** 83,736 single-word + 64,246 multiword headwords, ~2.1 MB brotli, ~102 KB per letter shard. Measured — reproduce with [`prototype/`](prototype/).

## 5. Phase 2 — Swap in Wiktextract (the real corpus)

Runs in parallel with Phase 1, not after it.

| # | Task |
|---|---|
| 9 | Download the kaikki English dump. **Not via the API** — 80k requests against a one-person free service is abusive; kaikki publishes dumps for exactly this. [`07`](07-caching-and-licensing.md) §2 |
| 10 | Streaming JSONL filter → same emitted format as step 2. Curation is the work here, not parsing: 1,385,953 raw word forms include braille, emoji, chemical names and inflections |
| 11 | **Take the forms map from the data**, don't generate it. Wiktextract gives `"forms":[{"word":"carbon sinks","tags":["plural"]}]` directly — verified in a live response |
| 12 | Parse each article's `## Key Vocabulary` into the curated layer. `splitSections()` already names this section `key-vocabulary` |
| 13 | Commit the built data. CI, Vercel and fresh clones must build with no network |
| 14 | Add `LICENSE` (CC BY-SA 4.0) to the data folder + attribution in the existing footer |
| 15 | Delete the WordNet adapter |

**Sizing is an estimate, not a measurement:** ~30–50 MB raw, ~6–10 MB brotli, ~250–400 KB per letter shard. Confidence: low-medium. Measure at step 10 and revisit shard granularity then.

## 6. Phase 3 — Fit and finish

| # | Task |
|---|---|
| 16 | Dictionary-coverage check in `verify.mjs`, alongside `check-content.mjs` — fail if shards are stale relative to `content/` |
| 17 | IPA display (RP + General American side by side) |
| 18 | Underline `keywords:` front-matter terms subtly |
| 19 | Real-device mobile testing — native selection callouts overlap custom controls |
| 20 | `docs/dictionary.md` + a row in the root README table |

---

## 7. UI spec (settled)

Full detail in [`04-selection-ui.md`](04-selection-ui.md) §2a. The operative rules:

**Trigger.** One `selectionchange` listener on `.article-body`, debounced ~200 ms. Reject: empty, >4 words, contains a newline, outside `.article-body`, inside `<code>`/`<pre>`/headings, no letters.

**⚠️ Capture the selected string when the selection settles — never re-read `getSelection()` at activation time.** Between selection and activation, a tap, a dismissed native menu or a focus change can collapse the live selection. Capturing once eliminates the entire bug class.

**Panel, all devices.** Full-width, pinned to the **opposite half of the viewport** from the selection, so it never covers the word. Add **hysteresis** — latch on open, or use a 40%/60% dead zone — or it flips while the user adjusts a selection near the middle. Measure with `visualViewport`, not `window.innerHeight`.

**Two-step.** A "Define" button appears; the panel opens on activation. Prevents false positives when someone is copying a quote, and gives "no entry found" somewhere to live.

**Focus — do not auto-focus the button.**

| Input | Behaviour |
|---|---|
| Mouse / touch | Button appears, **no focus change** |
| Keyboard (Shift+Arrow) | Button focusable but not focused — next in tab order |
| Any | **`d`** defines the current selection |
| Screen readers | `aria-live="polite"` announces availability |
| Panel opens | *Then* move focus in and trap it. `Esc` closes and restores |

**Panel content, in order:** headword + POS + IPA + audio · 1–2 senses (never eight) · one example · 2–3 synonyms · source link. Where the word is in the article's `## Key Vocabulary`, **show that first**, visually distinguished.

**Multiword lookup — no enumeration.** Match the selection against the dictionary's own phrase inventory, longest span first, then fall back to the head word. WordNet alone has 64,246 multiword headwords. [`06`](06-lookup-scope.md) §2.

**Styling.** Use existing CSS custom properties from `app/globals.css` — "Quiet Editorial" per `docs/STYLE-SPEC.md`, including dark mode via `app/theme-toggle.js`.

---

## 8. Guardrails specific to this repo

| Rule | Why |
|---|---|
| Dictionary payload must be `data-pagefind-ignore` | `postbuild.mjs` indexes built HTML; definitions would pollute every search result |
| Build the dictionary **before** `next build` | The Route Handler reads its output at build time. Pagefind runs *after* — this is the mirror image of `postbuild.mjs` |
| Never fail the build on a fetch error | Fall back to committed data and warn |
| Commit the built data | Otherwise CI re-fetches and a vendor outage breaks deploys |
| Don't touch the remark pipeline | Selection lookup needs no markdown changes — keep `lib/articles.js` doing one job |
| Shard, don't inline | A reader touching 8 letters shouldn't download 26 |
| Lazy-load article lookup on first selection | Reading shouldn't pay for a feature not yet used. The search tab *may* prefetch its headword index |
| Keep the dictionary tab separate from Pagefind results | Merging two ranked lists — articles and words — produces a confusing result set |
| Confirm the emitted Route Handler path after first build | `trailingSlash: true` affects it |

---

## 9. Migration checklist — if you later move to a server

1. Remove `output: "export"` from `next.config.mjs`.
2. Remove `export const dynamic = "force-static"` from the Route Handler. It becomes a live API route at the same URL — **client code unchanged**.
3. *Optional:* move lookups server-side, add ISR, add lookup analytics.
4. Re-check SEO — `docs/tech-stack-decisions.md` chose SSG so crawlers see complete HTML. Keep server rendering; don't drift to client-only.

Steps 1–2 are two deletions. Everything else is optional.

---

## 10. Known risks

| Risk | Mitigation |
|---|---|
| **Wiktextract curation is the real work** and its output size is unmeasured | Phase 1 ships on WordNet, so UI progress never blocks on it. Measure at step 10 |
| Share-alike applies to the derived data | Scoped to the data folder via its own `LICENSE`. Doesn't touch articles or code — CC BY-SA 4.0 §4(b) |
| freedictionaryapi.com is one operator, no SLA | Only a fallback. Site fully functional with it switched off |
| Lemmatization gaps make lookup feel broken | Wiktextract supplies the forms map directly. The ~30–40% failure-rate figure is general NLP experience, **not measured against this corpus** — check early |
| Native mobile selection menus overlap the button | Real-device testing, step 19 |

---

## 11. Answering the original two questions

**Q1 — best API to integrate?** **freedictionaryapi.com**, as a fallback rather than a foundation: free, no key, CORS, good IPA, and its CC BY-SA 4.0 data is the only kind you may legally cache and commit. Merriam-Webster has better learner definitions but forbids the caching this design needs. For bulk, don't use any API — take the kaikki dumps.

**Q2 — embedded dictionary with no third-party API?** **Yes, and that's the design.** Wiktextract data, self-hosted, sharded, served as static JSON. No key, no limit, no cost, works offline. WordNet measured at 2.1 MB brotli / ~102 KB per shard for 84k headwords; Wiktextract is larger but the same shape.

---

**Rationale:** [`01`](01-architecture-fit.md) architecture · [`02`](02-api-options.md) APIs · [`03`](03-embedded-options.md) corpora · [`04`](04-selection-ui.md) UI · [`06`](06-lookup-scope.md) scope · [`07`](07-caching-and-licensing.md) licensing · [`08`](08-sources.md) sources
