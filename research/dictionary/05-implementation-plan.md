# 05 — Implementation plan for this repo

Written against the actual files in `site/`. Every path below is real.

---

## The design in one diagram

```
BUILD TIME  (npm run build — no secrets ever reach the client)

  site/content/*.md
        │
        ├─ lib/articles.js  ──────────────► already parses front matter +
        │                                    splits ## sections (incl.
        │                                    "Key Vocabulary")
        ↓
  scripts/build-dictionary.mjs   ◄── NEW
        │
        ├─ 1. tokenize every article body
        ├─ 2. lemmatize → surface-form → headword map
        ├─ 3. parse each article's ## Key Vocabulary → curated glosses
        ├─ 4. look up remaining lemmas:
        │        WordNet (local, offline, always works)
        │        + freedictionaryapi.com  (IPA, examples, synonyms)
        │        + Merriam-Webster Learner's (optional, needs MW_KEY)
        │      ── responses cached to a committed JSON file, never re-fetched
        ↓
  app/dictionary/[shard]/route.js  (force-static)  ──► static JSON at build
  public/audio/*.mp3                                   (article vocab only)

RUNTIME  (browser — zero API calls, zero secrets)

  .article-body  ──selection──►  Client Component
                                   │
                                   ├─ lemmatize via forms map
                                   ├─ fetch('/dictionary/<shard>')  (cached)
                                   └─ popover: curated gloss → dictionary
                                              audio: mp3 else speechSynthesis
```

**Why this shape:** it makes zero runtime API calls, ships no secrets, works offline, has no rate limit to exhaust, and — per [`01-architecture-fit.md`](01-architecture-fit.md) §3 — is identical before and after a migration to a server.

---

## Phase 1 — Working lookup, offline, no external dependency

Goal: prove the interaction end to end before investing in data quality.

| # | Change | File |
|---|---|---|
| 1 | Generate the WordNet index. `prototype/build-wordnet-index.py` already does this — port to Node or run it once and commit the output | `research/dictionary/prototype/` |
| 2 | New build script: tokenize articles → lemma set → extract only those entries → emit shards + forms map | `site/scripts/build-dictionary.mjs` |
| 3 | Serve the shards as static JSON via a `force-static` Route Handler | `site/app/dictionary/[shard]/route.js` |
| 4 | Selection listener + popover, using existing CSS custom properties | `site/app/dictionary-popover.js` (Client Component) |
| 5 | Mount it around the article body | `site/app/articles/[slug]/page.js` |
| 6 | Wire the build script into the build, next to Pagefind | `site/package.json` → `build`, and/or `scripts/postbuild.mjs` |
| 7 | Audio via `speechSynthesis` — zero bytes, complete coverage | popover component |

**Expected size:** ~4,000–6,000 unique lemmas across the corpus → **~150–300 KB gzipped**, sharded by letter so a reader fetches only what they touch. Measured basis in [`03-embedded-options.md`](03-embedded-options.md).

**Ordering note:** step 2 must run *before* `next build`, since the Route Handler reads its output at build time. Pagefind runs *after*. So it's a prebuild step, not a postbuild one — the mirror image of `postbuild.mjs`.

**Result:** fully working, offline, zero-dependency lookup. Definitions terse but correct.

---

## Phase 2 — Definition quality

The gap between Phase 1 and something genuinely good for a B2–C1 learner.

| # | Change |
|---|---|
| 8 | **Parse `## Key Vocabulary` into a curated gloss layer.** `splitSections()` already names this section `key-vocabulary`. Parse `- **word** — definition. *Example.*` and key it by article slug. **Highest-priority source in the popover** |
| 9 | Enrich from **freedictionaryapi.com** at build time: IPA (RP + GenAm), one example, 2–3 synonyms. 1,000 req/hour means the whole corpus completes in one or two hours, once |
| 10 | **Commit the response cache** to a JSON file so CI and Vercel never re-fetch. This is the step that makes rate limits irrelevant |
| 11 | Merge order: **Key Vocabulary → Merriam-Webster Learner's → Wiktionary → WordNet** |
| 12 | Audio: fetch Commons recordings for article vocabulary, transcode, self-host in `public/audio/` — same pattern as `scripts/download-covers.mjs` |
| 13 | Attribution block, marked `data-pagefind-ignore` |

### Optional: Merriam-Webster Learner's

The best definition quality available free, and build-time caching neutralises its 1,000/day cap entirely.

- Register at [dictionaryapi.com](https://dictionaryapi.com/) for the **Learner's Dictionary with Audio**
- Key in `.env.local` (gitignored) and Vercel env vars — never in client code
- Backfill the existing corpus over a few days at 1,000/day, then ~50 words per new article
- **Non-commercial only**, and the M-W logo must be displayed
- If the key is absent, the build must fall back silently to Wiktionary + WordNet — **CI and fresh clones must not break without it**

---

## Phase 3 — Fit and finish

| # | Change |
|---|---|
| 14 | Add a dictionary-coverage check to `verify.mjs`, next to `check-content.mjs` — fail if any article has lemmas with no entry, or if the shards are stale relative to `content/` |
| 15 | Underline the article's `keywords:` front-matter terms subtly, so learners see the intended lesson vocabulary |
| 16 | Mobile testing on a real device — native selection menus overlap custom controls (see [`04-selection-ui.md`](04-selection-ui.md) §2) |
| 17 | Document it: `docs/dictionary.md`, and a row in the README table |

---

## Guardrails specific to this repo

| Rule | Why |
|---|---|
| Dictionary payload must be `data-pagefind-ignore` | `postbuild.mjs` indexes built HTML; definitions would pollute search results |
| The build must not fail without `MW_KEY` | Fresh clones, CI, and Vercel preview builds have to work |
| Commit the API response cache | Otherwise every CI build re-fetches, and a vendor outage breaks deploys |
| Don't touch the remark pipeline | Selection-based lookup needs no markdown changes — keep `lib/articles.js` doing one job |
| Shard the data, don't inline it all | A reader touching 8 letters shouldn't download 26 |
| Lazy-load on first selection, not page load | Reading shouldn't pay for a feature not yet used |
| Use existing CSS custom properties | `docs/STYLE-SPEC.md` "Quiet Editorial" + dark mode via `app/theme-toggle.js` |
| Keep `output: "export"` | Nothing in this plan requires dropping it — see `01-architecture-fit.md` §4 |

---

## Migration checklist — if you later move to a server

Kept short deliberately, because the answer is "there's almost nothing to do":

1. Remove `output: "export"` from `next.config.mjs`.
2. Remove `export const dynamic = "force-static"` from `app/dictionary/[shard]/route.js`. It becomes a live API route at the same URL. **Client code unchanged.**
3. *Optionally* move lookups server-side to shrink the client payload — only worth it if the dictionary grows past article vocabulary.
4. *Optionally* add ISR to refresh dictionary data without a full rebuild.
5. Re-check SEO. `docs/tech-stack-decisions.md` chose SSG specifically so crawlers see complete HTML — keep server rendering, don't drift to client-only.

Steps 3–5 are optional. Steps 1–2 are two deletions.

---

## Effort estimate

| Phase | Scope | Rough effort |
|---|---|---|
| 1 | Build script, Route Handler, popover, `speechSynthesis` | 1–2 days |
| 2 | Key Vocabulary parsing, API enrichment, caching, audio | 2–3 days |
| 3 | Verify check, keyword underlining, mobile, docs | 1 day |

---

## Answering the original two questions, for this architecture

**Q1 — Best API to integrate?** For **build-time enrichment** (which is where API calls belong here): **freedictionaryapi.com** as the default — free, no key, generous limits, good IPA and examples. Add **Merriam-Webster Learner's** if you want the best learner-grade definitions and accept the logo requirement. At *runtime* on static export, only key-less CORS-enabled APIs are reachable — but with build-time caching you don't need any runtime API at all.

**Q2 — Embedded dictionary with no third-party API?** Yes, and it's the right base layer here. **WordNet scoped to your article vocabulary: ~150–300 KB gzipped.** No key, no limit, no cost, works offline, and — because your content is a closed corpus — it covers essentially every word a reader can select.

---

**Sources:** see [`06-sources.md`](06-sources.md).
