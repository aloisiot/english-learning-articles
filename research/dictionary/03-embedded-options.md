# Q2 — Embedded dictionary with no third-party API

> **Question:** Is it possible to have an embedded dictionary that does not depend on a third-party API?
> **Answer: Yes, and it is the option that best satisfies "zero cost + no rate limits."** It works on a pure static host with no backend at all.

All sizes below are **measured**, not estimated. Scripts to reproduce are in [`prototype/`](prototype/).

---

## The core insight

An English dictionary is not big data. The full sense inventory of English fits in a few megabytes of compressed JSON. Once it's a static file on your own host, there is no API, no key, no rate limit, no vendor, no cost, and no network round-trip on lookup.

The only real question is **which corpus** and **how you ship it**.

---

## Part A — Which free dictionary corpus?

| Corpus | Size | Licence | Definition quality | Verdict |
|---|---|---|---|---|
| **WordNet 3.1** (Princeton) | 34 MB raw dict files | **Princeton WordNet licence** — free for any purpose incl. commercial, redistribution allowed, just keep the notice | Terse but accurate; ~207k senses; some examples | ⭐ **Best default.** Cleanest licence, easiest to parse, smallest |
| **Open English WordNet 2024** | ~312 MB resource; JSON zip | **CC BY 4.0** | Same style as WordNet, actively maintained, 120,630 synsets / 161,705 words | ⭐ Best if you want an actively-updated WordNet |
| **Wiktextract / kaikki.org English** | 2.6 GB gz raw (22.9 GB uncompressed); **Simple English extract: 35.5 MB (4.4 MB gz)** | **CC BY-SA 4.0** | Richest — IPA, multi-accent, examples, quotes, etymology, audio file refs | ⭐ Best data, needs a real extraction pipeline. **The Simple English extract is a hidden gem for learners** |
| **Wordset Dictionary** | ~177k words, JSON per letter | **CC BY-SA 4.0** | WordNet-derived + 63,936 manual human edits | Good; frozen since 2017 |
| **GCIDE / Webster's 1913** | ~100 MB | **Public domain** (text) | Beautiful prose, but 1913 English — archaic senses, missing modern words | ✗ Charming, wrong for a learner site |
| **Merriam-Webster / Oxford / Cambridge** | — | Proprietary | Best | ✗ Cannot be embedded. Licensed API access only |

### Licence detail worth knowing

- **WordNet (Princeton):** "Permission to use, copy, modify and distribute this software and database and its documentation for any purpose and without fee or royalty is hereby granted, provided that you agree to comply with the following copyright notice and statements." You must keep the notice; you may not use Princeton's name in advertising. Recognised by the [OSI](https://opensource.org/license/wordnet). **This is the most permissive option and the least legal thinking required.**
- **Wiktionary-derived data (kaikki / Wordset):** **dual-licensed CC BY-SA 4.0 *and* GFDL** — take CC BY-SA 4.0 and comply with that. Attribution *and* share-alike. For a site that displays definitions with a credit line this is fine, but note it means your dictionary data files inherit BY-SA. Exact obligations — including the two most commonly missed, the modification notice and the warranty disclaimer — in [`07-caching-and-licensing.md`](07-caching-and-licensing.md) §3.
- **Open English WordNet:** CC BY 4.0 — attribution only, no share-alike. Cleaner than BY-SA if you care.

### The Simple English Wiktionary extract — worth a serious look

kaikki.org publishes a **Simple English Wiktionary extract at 35.5 MB (4.4 MB gzipped)**. Simple English Wiktionary defines words using a restricted core vocabulary — which is *exactly* the pedagogical property that makes Merriam-Webster's Learner's Dictionary good for B2–C1 readers. It is the only free, embeddable corpus with learner-oriented phrasing. Coverage is much smaller than full Wiktionary, so it works best as a **preferred layer on top of WordNet**, not as a sole source.

---

## Part B — Measured prototype results

I parsed `wordnet-db@3.1.14` (the npm distribution of Princeton WordNet 3.1) into a headword → senses index and measured the output.

**Prototype run, 2026-08-11:**

```
headwords: 147,982
senses:    207,272
```

| Build variant | Headwords | Raw JSON | gzip -9 | brotli q11 | SQLite (4 KB pages) |
|---|---|---|---|---|---|
| Full (all senses, incl. multiword phrases) | 147,982 | 22.4 MB | **4.8 MB** | — | 27.3 MB |
| **Single-word only, ≤3 senses each** | 83,736 | 12.1 MB | **2.9 MB** | **2.1 MB** | 14.5 MB |
| Same + definitions capped at 120 chars | 83,736 | 11.9 MB | 2.8 MB | **2.0 MB** | — |
| Same, split into 26 per-letter shards | 83,736 | — | — | **2.7 MB total** | — |

**The number that matters: ~102 KB average per letter shard, brotli-compressed.**

A user reading an article touches maybe 8–12 distinct first letters. That's roughly **0.8–1.2 MB of one-time transfer, cached forever** — and that's for the *entire English language*. If you scope it to just your article vocabulary (Option 1 below), it drops to a couple hundred kilobytes total.

**Sample output quality:**

```json
"ubiquitous": [
  { "p": "a", "d": "being present everywhere at once", "e": [] }
],
"mitigate": [
  { "p": "v", "d": "make less severe or harsh", "e": ["mitigating circumstances"] },
  { "p": "v", "d": "lessen or to try to lessen the seriousness or extent of",
    "e": ["The circumstances extenuate the crime"] }
]
```

Accurate, compact, sometimes with an example. Notably terser than Wiktionary or M-W Learner's — see the quality note in [`02-api-options.md`](02-api-options.md).

---

## Part C — Four architectures, ranked

### ⭐ Option 1 — Build-time extracted subset (recommended)

**Idea:** your articles are a closed, known corpus. At build time, tokenize every article, lemmatize, and extract *only those words* from the dictionary into a small JSON file shipped with the site.

**Sizing:** a 60-article site at ~350 words each ≈ 21,000 tokens ≈ **3,000–6,000 unique lemmas**. At the measured ~145 bytes/headword (12.1 MB ÷ 83,736), that's **~450–900 KB raw, ~150–300 KB gzipped** — small enough to inline in the page bundle.

| | |
|---|---|
| **Works on** | Any host. Pure static. GitHub Pages, Netlify, Vercel, S3 |
| **Runtime deps** | None. Zero network calls on lookup |
| **Latency** | Instant — it's an in-memory object |
| **Offline** | Yes, fully |
| **Downside** | Only covers words in your articles. Words a user types in the search box won't resolve |
| **Fix for the downside** | Fall back to `freedictionaryapi.com` for misses. 99% of lookups hit local |

This is the option that most cleanly satisfies "zero cost + no rate limits."

---

### Option 2 — Sharded JSON, fetched on demand

**Idea:** ship the full 84k-headword dictionary as 26 per-letter brotli files. On lookup, fetch `/dict/m.json` once, cache it, serve every `m*` lookup from memory thereafter.

```
/public/dict/a.json   (~102 KB br)
/public/dict/b.json
...
/public/dict/z.json
```

Optionally shard by two letters (`ab.json`, `ac.json`, …) for ~10–20 KB chunks if you want first-lookup latency under 50 ms on slow connections.

| | |
|---|---|
| **Works on** | Any static host |
| **Total data** | 2.7 MB, but users only ever fetch the shards they touch |
| **Latency** | ~100 KB fetch on first lookup per letter, then instant |
| **Offline** | Yes, with a service worker pre-caching all 26 shards (2.7 MB) |
| **Downside** | 2.7 MB in your repo; slightly more build tooling |

Best if you want lookup on *any* English word, not just article vocabulary.

---

### Option 3 — SQLite over HTTP Range requests (`sql.js-httpvfs`)

**Idea:** put the 14.5 MB `.sqlite` file on your static host. [`sql.js-httpvfs`](https://github.com/phiresky/sql.js-httpvfs) runs SQLite compiled to WASM in a Web Worker with a virtual filesystem that fetches only the 4 KB database pages a query actually reads, via HTTP `Range` requests.

Reported behaviour: for a 670 MB database, a simple indexed key lookup transfers roughly **1 KB**. GitHub Pages, S3, Cloudflare Pages and Netlify all support Range requests out of the box.

| | |
|---|---|
| **Works on** | Any static host that supports HTTP Range (all major ones do) |
| **Transfer per lookup** | ~1–4 KB |
| **Upfront cost** | ~1–1.5 MB of WASM + worker before the first query resolves |
| **Downside** | **At this data size it's the wrong tool.** The WASM payload alone exceeds the entire brotli-compressed dictionary from Option 2. Also: read-only, and its page cache never evicts, so memory grows over a long session |
| **When it *is* right** | If you later embed the full Wiktextract corpus (multi-GB) — then Range-request SQLite is the only sane approach |

Genuinely clever, and worth knowing about. Just not justified for 2.7 MB of data.

---

### Option 4 — Serverless function + edge database

**Idea:** a Cloudflare Worker / Netlify Function / Vercel Edge Function backed by KV or D1 holding the dictionary; the browser calls `/api/define?w=ubiquitous`.

**Cloudflare D1 free tier:** 5 GB storage, **5,000,000 rows read/day**, 100,000 rows written/day, limits reset 00:00 UTC. At one row per lookup, that's 5M lookups/day free — effectively unlimited for this site.

| | |
|---|---|
| **Works on** | Anywhere with serverless functions |
| **Cost** | $0 within free tier |
| **Payload** | Tiny — one JSON object per lookup |
| **Bonus** | Lets you log which words learners look up → data for choosing future article vocabulary. **This is the one real reason to pick this option** |
| **Downside** | Adds a runtime dependency and a deploy target. Slower than in-memory. Doesn't work offline |

Only worth it if you want lookup analytics, or if you also want to hide a Merriam-Webster API key behind a proxy.

---

## Part D — What you still need alongside the data

An embedded dictionary is not just a JSON blob. Two pieces are non-optional:

1. **Lemmatization.** Readers click `mitigated`, `knives`, `farthest` — the dictionary keys are `mitigate`, `knife`, `far`. Covered in [`04-selection-ui.md`](04-selection-ui.md).
2. **Audio and IPA.** WordNet has neither. Options — including free Wikimedia Commons pronunciation files and the browser's built-in `speechSynthesis` — also in [`04-selection-ui.md`](04-selection-ui.md).

---

## Verdict on Q2

| | |
|---|---|
| **Is it possible?** | Yes, unambiguously |
| **Best architecture** | **Option 1** (build-time subset) for this site; **Option 2** (sharded JSON) if you want universal lookup |
| **Best corpus** | **WordNet 3.1** for licence simplicity and size; add the **Simple English Wiktionary extract** (35.5 MB / 4.4 MB gz) as a preferred learner-friendly layer |
| **Cost** | $0, permanently |
| **Rate limits** | None — it's your own static file |
| **Main trade-off** | WordNet definitions are terser and less learner-friendly than Merriam-Webster Learner's or Wiktionary |

The trade-off is resolved by the hybrid in [`05-implementation-plan.md`](05-implementation-plan.md).

---

**Sources:** see [`08-sources.md`](08-sources.md).
