# 02 — Dictionary API options

> **Question:** What are the best API alternatives to integrate? Are there good free options?
> **Short answer:** Yes. `freedictionaryapi.com` is the best free general-purpose option; Merriam-Webster's Learner's Dictionary is the best free option for *learner-quality* definitions. Both have real limits worth understanding before you commit.

All facts below were verified against primary sources on **2026-08-11**. Reference list in [`06-sources.md`](06-sources.md).

---

## ⚠️ Read this first: build time vs runtime

On this site's current `output: "export"` config, **where** you call an API decides **which** APIs you can use. This distinction reframes every row in the table below.

| | Runtime (browser) | Build time (`next build`) |
|---|---|---|
| Keyed APIs — M-W, Cambridge, Oxford, Wordnik | ✗ **Impossible.** No server to hide the key on; putting it in client JS exposes it | ✅ **Fully available.** A build script or Server Component reads `process.env`, and the key never leaves the build machine |
| Key-less CORS APIs — freedictionaryapi.com, Wiktionary, Datamuse | ✅ Direct browser call works | ✅ Works |
| Rate limits | A live constraint, scaling with traffic | A **one-time backfill cost** — your vocabulary is finite |

**Consequence:** the recommended architecture calls these APIs at build time and caches the responses, so "free tier is only 1,000/day" stops being a real limit. See [`01-architecture-fit.md`](01-architecture-fit.md) §2 and [`05-implementation-plan.md`](05-implementation-plan.md).

Read the rest of this document as *"which data source do I want baked into the build"*, not *"which service will my site depend on at runtime"*.

---

## Comparison table

| API | Cost | Rate limit | Key? | CORS | Data source | Licence | Audio | IPA |
|---|---|---|---|---|---|---|---|---|
| **freedictionaryapi.com** | Free | 1,000/hour/IP | No | Yes | English Wiktionary (via wiktextract) | CC BY-SA 4.0 + attribution | No (data has links) | Yes, multi-accent |
| **Merriam-Webster** (Collegiate / Learner's / etc.) | Free non-commercial | 1,000/day/key, 2 keys | Yes | Server-side only | M-W proprietary | Proprietary, logo required | Yes | Yes |
| **Wiktionary REST / Action API** | Free | 200 req/s (shared, all Wikimedia) | No | Yes | Wiktionary | CC BY-SA | Via linked files | Inline in wikitext |
| **Wordnik** | Free basic | 100 calls/hour | Yes | Yes | AHD, Century, Wiktionary, GCIDE, WordNet | Mixed per-source | Yes | Yes |
| **Datamuse** | Free | 100,000/day (key required from 2027-01-01) | No (for now) | Yes | Multiple open corpora | Free to use, ack. requested | No | Yes (`md=r`) |
| **Words API** (RapidAPI) | Free tier | 2,500/day | Yes | Server-side | WordNet-derived + extras | Proprietary | No | Yes |
| **Cambridge** | Free < 3,000/month, then £50/mo | Per plan | Yes | Server-side | Cambridge learner's dictionaries | Proprietary | Yes | Yes |
| **Oxford (OED/ODE)** | From £50/mo, billed annually | Per plan | Yes | Server-side | Oxford | Proprietary | Yes | Yes |
| ~~dictionaryapi.dev~~ | Free | None enforced | No | Yes | **Scraped Google/Oxford** | **None / unclear** | Yes (gstatic) | Yes |

---

## 1. freedictionaryapi.com — best free option overall ⭐

**Endpoint:** `GET https://freedictionaryapi.com/api/v1/entries/en/{word}`

### Why it wins on your stated priorities

- **Zero cost, no key, CORS enabled** → can be called directly from the browser on a static site with no backend and no secret to protect.
- **1,000 requests/hour per IP**, resetting hourly (UTC). For a reading site where one visitor looks up maybe 10–30 words per article, this is effectively unlimited per user. It only becomes a problem if many users share one IP (school lab, corporate NAT).
- **8.5M+ words**, structured JSON with an OpenAPI 3.0 spec.
- Data is regenerated from Wiktionary about once a month via [wiktextract](https://github.com/tatuylonen/wiktextract), so it inherits Wiktionary's coverage of slang, technical terms, and neologisms that closed dictionaries lack.

### Verified live response

Real response for `ubiquitous`, fetched 2026-08-11 (trimmed):

```json
{
  "word": "ubiquitous",
  "entries": [{
    "language": { "code": "en", "name": "English" },
    "partOfSpeech": "adjective",
    "pronunciations": [
      { "type": "ipa", "text": "/juːˈbɪkwɪtəs/", "tags": ["Received Pronunciation"] },
      { "type": "ipa", "text": "/juˈbɪkwɪtəs/", "tags": ["Canada", "General American"] },
      { "type": "ipa", "text": "/jʉːˈbɪkwɪtəs/", "tags": ["General Australian"] }
    ],
    "senses": [
      {
        "definition": "Being everywhere at once: omnipresent.",
        "examples": ["In Christianity, Hinduism, and Judaism, God is ubiquitous."],
        "synonyms": ["omnipresent"]
      },
      {
        "definition": "Appearing to be everywhere at once...",
        "quotes": [{
          "text": "...the unearthly conceit that Moby Dick was ubiquitous...",
          "reference": "1851, Herman Melville, Moby-Dick, ch. 41"
        }],
        "synonyms": ["ever-present"]
      },
      { "definition": "Widespread; very prevalent.", "synonyms": ["common", "pervasive"] }
    ]
  }],
  "source": {
    "url": "https://en.wiktionary.org/wiki/ubiquitous",
    "license": { "name": "CC BY-SA 4.0", "url": "https://creativecommons.org/licenses/by-sa/4.0/" }
  }
}
```

Note the **literary quotes with full citations** — for a B2–C1 learner site, that's genuinely useful teaching material, not just filler.

### Obligations

Per their [licence section](https://freedictionaryapi.com/), you must:
1. Link back to the original Wiktionary page (the API hands you the URL in `source.url`).
2. Show a visible attribution to FreeDictionaryAPI.com.
3. CC BY-SA 4.0 applies to the content — if you cache and republish definitions in bulk, share-alike kicks in.

### Risks

- **Single-operator service.** No SLA, no funding model disclosed. If it disappears, your lookup feature dies. Mitigate by caching aggressively and having the embedded fallback from [`03-embedded-options.md`](03-embedded-options.md).
- **Wiktionary tone.** Definitions are encyclopaedic/etymological, not pedagogical. Sense ordering is not frequency-ordered, so the *first* definition is often not the *most common* one. For learners this matters — see the "quality" note at the bottom.

---

## 2. Merriam-Webster Learner's Dictionary — best *quality* free option for learners ⭐

**Endpoint:** `GET https://dictionaryapi.com/api/v3/references/learners/json/{word}?key={KEY}`

This is the one that best matches your "best definition quality" priority, and specifically for a **B2–C1 learner audience**.

M-W publishes [nine reference APIs](https://dictionaryapi.com/products/index). The relevant ones:

- **Learner's Dictionary with Audio** — definitions written in controlled, simple English for non-native speakers. This is the pedagogically correct choice for your site.
- **Collegiate Dictionary with Audio** — full native-speaker dictionary.
- **Collegiate Thesaurus** — for synonym work.
- Elementary / Intermediate / School dictionaries — graded by US school level.

### Terms (verified from the M-W FAQ, 2026-08-11)

- Registration gives you **two API keys immediately**; more on request.
- **1,000 queries per key per day.** With two keys that's 2,000/day — but the free tier is limited to **two reference APIs**, so you'd typically pick Learner's + Collegiate Thesaurus.
- **Free only for non-commercial use.** "Commercial" per M-W = ad-supported or selling a product. A personal English-learning site with no ads and no paid product is non-commercial.
- Exceeding 1,000/day, or being commercial, requires a licensing fee — contact required, price not published.
- **All apps must display the Merriam-Webster logo**, per their [brand guidelines](https://dictionaryapi.com/info/branding-guidelines).

### Practical implication

1,000/day is the real constraint. A single reader working through one article could burn 20–40 lookups. That caps you at roughly **25–50 engaged sessions per day** before you hit the wall. Fine for a personal/small-class site; not fine if the site grows.

**Mitigation that makes this viable:** cache every M-W response permanently at build time or in a KV store. Your article vocabulary is a *finite, known set*. Once you've looked up all 4,000 unique words across your articles, you never call the API again. See [`05-implementation-plan.md`](05-implementation-plan.md) — this turns a 1,000/day API into a one-time build cost.

**Key handling:** the M-W key must not ship to the browser. Requires a serverless proxy or a build-time fetch.

---

## 3. Wiktionary / Wikimedia APIs — zero-dependency fallback

Three separate interfaces, all free and key-less:

- **Core REST API:** `https://api.wikimedia.org/core/v1/wiktionary/en/page/{title}` — returns wikitext.
- **Action API:** `https://en.wiktionary.org/w/api.php?action=parse&page={word}&format=json&origin=*` — the `origin=*` parameter enables CORS.
- **Experimental definition endpoint:** `https://en.wiktionary.org/api/rest_v1/page/definition/{word}` — returns pre-structured definitions grouped by language and part of speech. Marked experimental, so treat as unstable.

**Rate limit:** [200 requests/second](https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits), enforced per user across all Wikimedia sites. A descriptive `User-Agent` header is required — anonymous/generic user agents get throttled harder.

**Trade-off:** effectively unlimited and permanently maintained by a foundation that isn't going anywhere, but you do the parsing work yourself. `freedictionaryapi.com` is the same underlying data with the parsing already done, which is why it ranks above this.

---

## 4. Wordnik — richest aggregation, tightest free limit

**Pricing** (verified from [developer.wordnik.com/pricing](https://developer.wordnik.com/pricing), 2026-08-11):

| Plan | Price | Limit |
|---|---|---|
| Free Basic | $0 | **100 calls/hour** — free for nonprofit or research use |
| Hobby | $10/mo | 1,000 calls/hour |
| Pro | $59/mo | 20,000 calls/hour |
| Enterprise | $149/mo | 45,000 calls/hour |

Wordnik aggregates the **American Heritage Dictionary, Century Dictionary, Wiktionary, GCIDE and WordNet** in one response, plus example sentences drawn from a real corpus, related words, and word-frequency data. Data quality is arguably the best of any free-tier option.

**But 100 calls/hour is very tight** — that's one reader, mid-article. Donating $5 at signup gets your key within 24 hours instead of up to seven days. Only worth it if you cache at build time, in which case the hourly cap barely matters.

---

## 5. Datamuse — not a dictionary, but the best free *word-relations* API

**Endpoint:** `https://api.datamuse.com/words?...`

Datamuse explicitly says it is a word-*finding* engine and points you at Wordnik for rich definitions. It's the wrong tool for "what does this word mean" and the right tool for everything around it:

| Feature | Query |
|---|---|
| Synonyms / means-like | `?ml=ubiquitous` |
| Adjectives that describe a noun | `?rel_jjb=ocean` |
| Words that often follow a word (collocations) | `?lc=drink&sp=w*` |
| Strongly associated words | `?rel_trg=cow` |
| Autocomplete | `/sug?s=rawand` |
| Brief definitions, pronunciation, frequency | add `&md=dpf` |

**Limits:** free and key-less for **up to 100,000 requests/day**. From **2027-01-01 an API key becomes mandatory**, with the same 100k/day cap per key — worth diarising if you build on it.

For an English-learning site this is excellent for a "related words" / "collocations" panel next to the definition, and for the vocabulary-exercise generation your article format already calls for.

---

## 6. Words API (RapidAPI) — 2,500/day, WordNet-derived

- Free BASIC plan: **2,500 calls/day** (⚠️ RapidAPI's pricing page is client-rendered and could not be verified directly — check it live).
- Returns definitions, synonyms, antonyms, hypernyms/hyponyms, syllables, pronunciation, frequency.
- Underlying data is largely WordNet-derived — meaning **you can get the same content for free, offline, from the WordNet dump** (see [`03-embedded-options.md`](03-embedded-options.md)). This makes Words API hard to justify: you'd be paying a rate limit for data you can bundle.
- Requires RapidAPI account + key, and RapidAPI has been steadily tightening its free tiers.

---

## 7. Cambridge — good learner data, low free ceiling

- Developer hub: [dictionary-api.cambridge.org](https://dictionary-api.cambridge.org/)
- Base URL `https://dictionary.cambridge.org/api/v1/`, access key on signup.
- Dictionaries available: **Cambridge Advanced Learner's**, Dictionary of American English, Business English, Learner's Dictionary, plus bilingual pairs.
- **Free under 3,000 API calls/month**; paid from **£50/month for up to 15,000 calls**. ⚠️ These figures come from secondary coverage of the API launch — the Cambridge developer pages are client-rendered and I could not confirm current pricing directly. **Verify before relying on them.**

The Cambridge Advanced Learner's Dictionary is arguably *the* reference for B2–C1 learners. 3,000/month ≈ 100/day is lower than M-W's 1,000/day, so M-W Learner's beats it on the free tier. Worth revisiting if the site ever monetises.

---

## 8. Oxford — no meaningful free tier

Oxford [relaunched their API offering on 2025-01-09](https://developer.oxforddictionaries.com/updates) with two plans: **API Lite** (self-serve) and **Growing Business**. Verbatim from their announcement:

> "New Pricing Structure: Our new plans start from **£50 per month, billed annually**, making high-quality data more affordable than the average monthly gym membership."

There is no ongoing free tier. Excluded on your constraints.

---

## ⚠️ 9. dictionaryapi.dev — popular, and you should avoid it

This is the first result for "free dictionary API" and appears in thousands of tutorials. Reasons to avoid it for anything you intend to maintain:

1. **The data appears to be scraped from Google's dictionary (Oxford-licensed).** The GitHub repo is literally named [`meetDeveloper/googleDictionaryAPI`](https://github.com/meetDeveloper/googleDictionaryAPI), and responses contain audio URLs on `ssl.gstatic.com/dictionary/static/sounds/...` — Google's CDN. The example response on their own homepage shows this.
2. **No stated licence.** You would be redistributing Oxford-licensed content with no rights to it. Anyone paying Oxford £50/month is paying for exactly this data.
3. **No rate limits enforced *yet***, funded by PayPal donations to one individual. That is not a foundation you build a site on.
4. Hotlinking `gstatic.com` audio can break without notice.

If you want free Wiktionary-derived data, use `freedictionaryapi.com` — same "free, no key, CORS" ergonomics, with an actual licence and an actual data pipeline.

---

## On "best definition quality" — a note that matters for your use case

Your learner profile is **B2–C1, everything in English, no Portuguese scaffolding**. The three data families behave very differently:

| Source | `ubiquitous` renders as | Fit for B2–C1 |
|---|---|---|
| **M-W Learner's** | Written in controlled vocabulary, with usage labels and learner-oriented examples | ⭐ Best — designed for exactly this reader |
| **Wiktionary** (freedictionaryapi) | "Being everywhere at once: omnipresent." + 3 senses + Melville quote + multi-accent IPA | ⭐ Very good — rich, but sense order isn't frequency-ordered and register labels are inconsistent |
| **WordNet** (embedded) | "being present everywhere at once" | Adequate — accurate, terse, no examples for many words, no register/usage labels |

The practical consequence: **WordNet alone is a good safety net but a mediocre primary experience**; Wiktionary is a good primary experience; M-W Learner's is the best primary experience but must be cached at build time to survive the 1,000/day cap. The recommendation in [`05-implementation-plan.md`](05-implementation-plan.md) is built around exactly this.

---

**Sources:** see [`06-sources.md`](06-sources.md).
