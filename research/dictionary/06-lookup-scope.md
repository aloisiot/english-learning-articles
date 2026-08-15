# 06 — How big should the dictionary be?

> **The question:** article-scoped or complete? A hybrid of embedded + API + cache was proposed, partly because integrating the dictionary into the **search page** makes article-scoped coverage too limiting. And if the dictionary is complete, how are **multiword expressions** handled without enumerating every possible word combination?

**Short answer:** **yes to the hybrid, and your instinct about the search tab is right** — a searchable dictionary can't be limited to words that happen to appear in articles. But the hybrid should be sourced differently than proposed. **Multiword lookup needs no enumeration at all:** WordNet already ships **64,246 multiword headwords**, and Wiktionary has far more. You match the selection against an existing phrase inventory; you never generate combinations.

The important correction is about *which* embedded corpus. **WordNet is the wrong base layer if the dictionary becomes a browsable feature** — see §3.

---

## 1. The hybrid is right, and the search tab is why

Your reasoning is correct and it changes the earlier recommendation.

`05-implementation-plan.md` scoped the dictionary to article vocabulary (~4–6k lemmas, ~150–300 KB gzipped). That is optimal **if the only feature is selection lookup inside an article** — every word a reader can select is by definition in an article.

A dictionary tab on the search page breaks that assumption completely. The user types a word that isn't in any article and gets nothing. A dictionary that only knows the words you already wrote about isn't a dictionary; it's a glossary. So:

| Feature | Coverage needed |
|---|---|
| Selection lookup inside an article | Article vocabulary suffices |
| **Dictionary tab on the search page** | **Complete English** |

Once you build the complete one, the article-scoped one is a subset of it, not a separate artefact. That simplifies rather than complicates the build.

### On your guess about API definitions being better

You wrote *"even though API dictionaries can have better definitions (I'm not sure, just guessing)."*

Partly right, and the distinction matters:

- **Merriam-Webster Learner's** genuinely is better for a B2–C1 reader — written in controlled vocabulary for non-native speakers. But it can't be used the way you want; see [`07-caching-and-licensing.md`](07-caching-and-licensing.md).
- **freedictionaryapi.com is not a different data source from an embeddable one.** It serves Wiktionary data extracted with [wiktextract](https://github.com/tatuylonen/wiktextract). The same extraction is published as bulk downloads at [kaikki.org](https://kaikki.org/dictionary/rawdata.html). **The API's definitions and a self-hosted Wiktionary dictionary are the same definitions.**

So "API = better definitions" is false for the specific API you chose. The API's advantage is convenience, not quality. That reframes the whole hybrid: you are not trading quality for independence.

---

## 2. Multiword expressions — you don't enumerate, you match

> *"I think it isn't worth to store all possible expressions and word combinations present in all articles."*

Correct, and you don't have to. Combinatorial storage would be absurd — a 350-word article has ~60,000 possible 2–4 word spans. But that was never the approach, because **dictionaries already carry their own phrase inventory as headwords.**

Measured from `wordnet-db@3.1.14` on 2026-08-11 (reproduce with [`prototype/`](prototype/)):

| | Count |
|---|---|
| Total WordNet headwords | 147,982 |
| Single-word | 83,736 |
| **Multiword** | **64,246** |
| Longest entry | 9 words |

Length distribution: 2 words → 54,577 · 3 → 7,773 · 4 → 1,461 · 5 → 298 · 6+ → 137.

**43% of WordNet is already multiword expressions.** A multiword-only index is 8.3 MB raw / 1.7 MB gzipped. You store the dictionary's phrases, not your articles' combinations — and the storage is bounded by the dictionary, not by your corpus.

### The lookup algorithm

On a selection of N tokens, walk from longest to shortest and stop at the first hit:

```
selection: "put enormous strain on the grid"
  1. normalize (lowercase, strip punctuation, curly → straight apostrophes)
  2. cap N at ~6 tokens (longest realistic headword)
  3. try full span                  → "put enormous strain on the grid"   miss
  4. try each shorter span, longest first, left-anchored then sliding:
       "put enormous strain on the" → miss
       ...
       "strain on"                  → miss
  5. lemmatize each token, retry the spans
  6. fall back to the head word     → "strain"                            HIT
  7. still nothing → "no entry", offer the API as a live long-tail lookup
```

Two refinements worth the effort:

- **Precompute a phrase-prefix set** (all first tokens of multiword headwords, ~15k strings). If the selection's first token isn't in it, skip the entire multiword walk and go straight to single-word lookup. Turns the common case into one hash lookup.
- **Cap the span length at 4–6 tokens.** Entries longer than that are proverbs and Latin phrases; the cost of checking them on every selection isn't worth it.

This is O(N²) in the selection length with N ≤ 6, i.e. at most ~21 hash lookups. Free.

### What this reveals about coverage

Probing the two corpora with vocabulary drawn from your actual science/environment articles:

| Phrase | WordNet 3.1 | Wiktionary (via freedictionaryapi, fetched 2026-08-11) |
|---|---|---|
| `climate change` | ✅ "a change in the world's climate" | ✅ |
| `sea level` | ✅ | ✅ |
| `power grid` | ✅ | ✅ |
| `make sense` | ✅ | ✅ |
| `give up` | ✅ | ✅ |
| **`carbon sink`** | ❌ **not present** | ✅ "A natural or artificial reservoir that accumulates and stores some carbon-containing chemical compound for an indefinite period." |
| **`carbon footprint`** | ❌ **not present** | ✅ "A measure of the amount of carbon dioxide produced by a person, organization or state in a given time." |

`carbon sink` is in the title of one of your published articles. This is the deciding evidence for §3.

---

## 3. ⚠️ Challenge: WordNet is the wrong base layer for a complete dictionary

This is the one decision in `research-considerations.md` I think is wrong, and the reasoning has changed since [`03-embedded-options.md`](03-embedded-options.md) precisely *because* of the search-tab requirement you added.

WordNet was recommended as a **fallback safety net** — a layer that always answers, under a permissive licence, at trivial size. For that role it's ideal, and I stand by it.

But you're now proposing it as the base of a **browsable dictionary feature**. In that role its weaknesses stop being acceptable:

| Weakness | Why it didn't matter before | Why it matters now |
|---|---|---|
| **Terse, lexicographic definitions** — *ubiquitous → "being present everywhere at once"* | Fine as a fallback behind better sources | It becomes the primary text a learner reads in a dedicated dictionary UI |
| **No IPA, no audio** | The API supplied these | A dictionary tab with no pronunciation is a poor dictionary, and your learners are B2–C1 |
| **Frozen since 2006** (WordNet 3.0/3.1) | Rare words fell through to the API | Misses `carbon sink`, `carbon footprint`, and essentially all post-2006 vocabulary — exactly what your technology and environment articles are about |
| **Many entries have no example** | — | Examples are the single most useful field for a learner |

Meanwhile **Wiktionary/wiktextract data has none of these problems**, is the same data your chosen API already serves, and is **CC BY-SA 4.0 — freely redistributable with attribution**, which is precisely what you need to commit it to the repo (see [`07-caching-and-licensing.md`](07-caching-and-licensing.md)).

### Recommended change

| | Proposed in `research-considerations.md` | Recommended |
|---|---|---|
| Embedded corpus | WordNet 3.1 | **Wiktextract (kaikki.org) English, filtered** |
| API | freedictionaryapi.com | Same — but demoted to a **long-tail fallback**, not a primary source |
| WordNet's role | Base layer | **Optional.** Redundant once Wiktionary is embedded. Keep only if you want a guaranteed-permissive layer with no BY-SA obligation |

### The honest cost of this change

WordNet is *much* easier to work with, and that's not nothing:

| | WordNet | Wiktextract |
|---|---|---|
| Acquisition | `npm i wordnet-db` — 34 MB | 2.6 GB gzipped download (22.9 GB raw, all languages), or 3.0 GB English-only |
| Parsing | ~40 lines of Python (see `prototype/`) | Substantial filtering pipeline — sense selection, tag handling, quote stripping |
| Licence | Princeton — attribution only, no share-alike | CC BY-SA 4.0 — attribution **and** share-alike on the data |
| Time to first working build | Hours | Days |

**Pragmatic path:** ship Phase 1 on WordNet exactly as planned — it's the fastest route to a working interaction, and the parse script already exists. Treat swapping in Wiktextract as the Phase 2 data upgrade. The lookup code doesn't change; only the build script's input does. Design the index format now so the corpus is replaceable.

---

## 4. Sizing a complete embedded dictionary

**Measured** (WordNet, 2026-08-11):

| Build | Headwords | Raw | gzip | brotli |
|---|---|---|---|---|
| Full, all senses | 147,982 | 22.4 MB | 4.8 MB | — |
| Single-word, ≤3 senses | 83,736 | 12.1 MB | 2.9 MB | **2.1 MB** |
| Multiword only | 64,246 | 8.3 MB | 1.7 MB | — |
| Per-letter shards | 83,736 | — | — | **~102 KB/shard** |

**Estimated** for a Wiktextract-derived build — *this is extrapolation, not measurement, confidence: low-medium.* Scaling the measured ~145 bytes/headword raw by 3–5× for IPA, examples and richer sense data, over a learner-useful subset of roughly 60–80k lemmas: **~30–50 MB raw, ~6–10 MB brotli, ~250–400 KB per letter shard.** To verify this properly you'd have to actually build it; I could not download a 3 GB dump in this environment.

### Serving it

Sharding by first letter and lazy-loading is what makes a complete dictionary viable on a static host:

- **Article selection lookup** — a reader touches maybe 8–12 letters per article → under ~1 MB transferred, cached thereafter.
- **Search-page dictionary tab** — fetch one shard per query letter, cached. Add a lightweight headword-only index (~84k strings, ~400 KB gzipped) up front to power autocomplete and "did you mean" without loading any definitions.
- Shard by **two letters** (`ca.json`, `cb.json`) if single-letter shards get uncomfortable at Wiktextract sizes. `s` and `c` are the fat ones.
- Serve via the `force-static` Route Handler from [`01-architecture-fit.md`](01-architecture-fit.md) §3 so the migration path stays open.

---

## 5. Answering Q3 directly

> *"Can we have a complete English dictionary that can be consulted through a dictionary tab on the search page?"*

**Yes.** Technically unremarkable — a few MB of sharded static JSON, lazy-loaded, on the same infrastructure Pagefind already uses. It does not require a server.

Three design notes:

1. **Keep it a separate tab, not blended into article search.** Pagefind returns articles; the dictionary returns words. Merging the two ranked lists produces a confusing result set. A tab (or a distinct results section) keeps both legible.
2. **Don't put dictionary content into the Pagefind index.** `postbuild.mjs` indexes built HTML; if dictionary entries are rendered server-side into the search page they'd be indexed as article content and pollute every query. Fetch them client-side, or mark them `data-pagefind-ignore`.
3. **Autocomplete off the headword-only index.** Loading definition shards on every keystroke is wasteful; load the small headword list once, fetch the definition shard only on selection.

---

## 6. Revised recommendation

```
LAYER 1  Article's own ## Key Vocabulary        curated, best quality, tiny
LAYER 2  Embedded Wiktionary (Wiktextract)      complete, IPA, examples, CC BY-SA
         └─ Phase 1 shortcut: WordNet           fast to build, terse, no IPA
LAYER 3  freedictionaryapi.com, live            long-tail + words added since last build
LAYER 4  "No entry found" + link to Wiktionary  honest failure
```

Layer 3 becomes genuinely optional once Layer 2 is Wiktionary-derived — the same data, already local. Keep it as a fallback for words postdating your last build, and as the fetch mechanism during development, but the site should be fully functional with it switched off.

---

## 7. The two surfaces want different layer orders

> **⚠️ Superseded 2026-08-11.** This section was written to resolve a conflict — search tab in v1, but WordNet as the v1 corpus — by making the search tab API-first. **That conflict no longer exists: the v1 corpus is now Wiktextract** (§3, and the history box in [`README.md`](README.md)). With Wiktionary data embedded, the search tab needs no API to find `carbon sink`, so the API-first workaround is dropped.
>
> The section is kept because the *underlying distinction is still real and still shapes the code* — the two surfaces genuinely have different requirements, and the API remains the long-tail fallback for both. Only the **default source order** changes: both are now embedded-first.

**The distinction that still holds:**

| | **Article selection lookup** | **Search-page dictionary tab** |
|---|---|---|
| Frequency | High — many per article | Low — user types a word deliberately |
| Latency tolerance | None. Must feel instant | Fine. A spinner is expected in a search box |
| Must work offline | Yes — it's part of reading | No |
| Volume against the API | Would be abusive | Trivial — well inside 1,000/hr per IP |
| ~~Layer order (superseded)~~ | ~~Embedded first~~ | ~~API first~~ |
| **Layer order (current)** | **Embedded first**, API only for misses | **Embedded first**, API only for misses |

**Both are embedded-first now**, because the embedded corpus *is* Wiktionary data — the thing the API would have been fetched for is already local.

What the distinction still buys, in code:

- **Prefetching.** The search tab can load the headword-only index eagerly on page load; article lookup must stay lazy, because reading shouldn't pay for a feature not yet used.
- **API-miss behaviour.** In an article, a miss should fail quietly — a spinner mid-read is worse than "no entry". In the search tab a user has explicitly asked, so a brief loading state while the API is consulted is appropriate.
- **Offline.** Article lookup must work with no network. The search tab degrades to embedded-only, which is now a complete dictionary rather than a stopgap.

**What choosing Wiktextract bought:** the v1 search tab no longer depends on a single-operator free API being up. That dependency was the one real caveat of the previous design, and it's gone — the API is back to being what it should be, a fallback for words postdating the last build.

---

**Sources:** see [`08-sources.md`](08-sources.md).
