# 06 — Sources & references

All URLs verified on **2026-08-11**. Where a figure is quoted, the source it came from is named.

---

## Next.js architecture (added 2026-08-11 for [`01-architecture-fit.md`](01-architecture-fit.md))

- [**Next.js — How to create a static export**](https://nextjs.org/docs/app/guides/static-exports) — page version `16.3.0`, last updated 2026-08-09, matching this project's `next: ^16.3.0`. Source for: the supported-features list (Server Components run at build, Client Components, `force-static` Route Handlers rendering to static files, client-side fetch/SWR), the unsupported-features list (Request-reading Route Handlers, `cookies()`, `headers()`, rewrites, redirects, Proxy, ISR, Server Actions, Draft Mode, Intercepting Routes, default `next/image` loader, dynamic routes without `generateStaticParams()`), and the quote *"Next.js enables starting as a static site or Single-Page Application (SPA), then later optionally upgrading to use features that require a server."*
- [Next.js — Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [Next.js — API Routes in Static Export warning](https://nextjs.org/docs/messages/api-routes-static-export)
- [Next.js — Incremental Static Regeneration](https://nextjs.org/docs/app/guides/incremental-static-regeneration)

### Repository files read (2026-08-11)

`README.md` · `docs/overview.md` · `docs/tech-stack-decisions.md` · `docs/series.md` · `site/package.json` · `site/next.config.mjs` · `site/lib/articles.js` · `site/app/articles/[slug]/page.js` · `site/scripts/postbuild.mjs` · `site/scripts/verify.mjs` · `site/content/2026-08-07-ai-power-hunger.md`

Claims drawn from these: Next 16.3.0 / React 19.2.8 / App Router; `output: "export"` + `trailingSlash: true`; async build-time remark pipeline with `splitSections()`; `dangerouslySetInnerHTML` per section; Pagefind as a postbuild step with `data-pagefind-ignore` conventions; `verify.mjs` as the pre-push gate; the `## Key Vocabulary` section format; `download-covers.mjs` as the precedent for self-hosting external media.

---

## Dictionary APIs

### freedictionaryapi.com
- [Free Dictionary API — homepage & docs](https://freedictionaryapi.com/) — rate limits (1,000/hr/IP, hourly UTC reset), 8.5M+ words, CORS, no key, CC BY-SA 4.0 licence and attribution requirements, monthly data refresh
- [OpenAPI 3.0 spec](https://freedictionaryapi.com/api/v1/openapi.json)
- [API reference](https://freedictionaryapi.com/api/v1)
- [Status page](https://status.freedictionaryapi.com)
- Live response sample verified at `https://freedictionaryapi.com/api/v1/entries/en/ubiquitous`

### Merriam-Webster
- [Merriam-Webster Dictionary API — Developer Center](https://dictionaryapi.com/)
- [Our APIs — full product list](https://dictionaryapi.com/products/index) — all nine reference APIs incl. Learner's with Audio
- [FAQ](https://dictionaryapi.com/info/frequently-asked-questions) — 1,000 queries/key/day, 2 keys on registration, non-commercial free, licensing fee above 1,000/day or for commercial use, logo requirement
- [Terms of Service](https://dictionaryapi.com/info/terms-of-service)
- [Brand Guidelines](https://dictionaryapi.com/info/branding-guidelines)
- [Learner's Dictionary with Audio](https://dictionaryapi.com/products/api-learners-dictionary)
- [JSON documentation — audio files](https://dictionaryapi.com/products/json#sec-2.prs)

### Wordnik
- [Wordnik Developer Pricing](https://developer.wordnik.com/pricing) — Free Basic 100 calls/hr, Hobby $10/mo 1,000/hr, Pro $59/mo 20,000/hr, Enterprise $149/mo 45,000/hr
- [Getting Started](https://developer.wordnik.com/gettingstarted) — $5 donation → key within 24h, otherwise up to 7 days
- [API Docs](https://developer.wordnik.com/docs)
- [FAQ](https://developer.wordnik.com/faq)

### Datamuse
- [Datamuse API documentation](https://www.datamuse.com/api/) — 100,000 req/day free without key; **API key required from 2027-01-01**; full query parameter reference; explicit note that it lacks rich definitions and recommends Wordnik for those
- [Datamuse blog](https://blog.datamuse.com/)

### Wikimedia / Wiktionary
- [API:REST API — MediaWiki](https://www.mediawiki.org/wiki/API:REST_API) — Core API URL format `https://api.wikimedia.org/core/v1/{project}/{language}/{endpoint}`
- [Wikimedia REST API](https://www.mediawiki.org/wiki/Wikimedia_REST_API) — `/api/rest_v1/`, experimental definition endpoint
- [Wikimedia APIs/Rate limits](https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits) — 200 req/s shared across all Wikimedia APIs, User-Agent requirement
- [API Portal/Deprecation](https://wikitech.wikimedia.org/wiki/API_Portal/Deprecation)

### Cambridge
- [Cambridge Dictionary — Develop](https://dictionary.cambridge.org/develop.html)
- [Cambridge Dictionaries Online API Developer Hub](https://dictionary-api.cambridge.org/api/resources) — base URL, access key, available dictionaries
- [API demo](https://dictionary-api.cambridge.org/api/demo)
- Pricing (free < 3,000 calls/month; from £50/mo for 15,000 calls) per [STM Publishing coverage of the API launch](https://www.stm-publishing.com/cambridge-dictionaries-online-launches-new-api-and-free-demo-site-for-developers/)

### Oxford
- [Oxford Dictionaries API — Updates](https://developer.oxforddictionaries.com/updates) — 2025-01-09 relaunch, API Lite and Growing Business plans, from £50/month billed annually
- [Oxford Dictionaries API — home](https://developer.oxforddictionaries.com/)
- [FAQ](https://developer.oxforddictionaries.com/faq)

### Words API
- [Words API on RapidAPI](https://rapidapi.com/wordsapi/api/wordsapi) — BASIC free plan 2,500 calls/day
- [Words API pricing](https://rapidapi.com/wordsapi/api/wordsapi/pricing)

### dictionaryapi.dev (⚠️ not recommended)
- [dictionaryapi.dev homepage](https://dictionaryapi.dev/) — example response showing `ssl.gstatic.com/dictionary/static/sounds/...` audio URLs
- [GitHub: meetDeveloper/googleDictionaryAPI](https://github.com/meetDeveloper/googleDictionaryAPI) — repo name and provenance
- [GitHub: meetDeveloper/freeDictionaryAPI](https://github.com/meetDeveloper/freeDictionaryAPI)

---

## Embeddable dictionary corpora

### WordNet (Princeton)
- [WordNet — License and Commercial Use](https://wordnet.princeton.edu/license-and-commercial-use) — free for research and commercial use with citation
- [WordNet download page](https://wordnet.princeton.edu/download)
- [WordNet licence on OSI](https://opensource.org/license/wordnet)
- [SPDX: WordNet License](https://spdx.github.io/license-list-data/WordNet.html)
- [`wordnet-db` on npm](https://www.npmjs.com/package/wordnet-db) — v3.1.14, the package measured in the prototype. Bundled `LICENSE` file (WordNet Release 3.0, Princeton) read directly from the installed package

### Open English WordNet
- [globalwordnet/english-wordnet on GitHub](https://github.com/globalwordnet/english-wordnet) — CC BY 4.0
- [Releases](https://github.com/globalwordnet/english-wordnet/releases)
- [Open English WordNet (2024 version) — Oxford LLDS](https://llds.ling-phil.ox.ac.uk/llds/xmlui/handle/20.500.14106/2571-2024) — 120,630 synsets, 161,705 words, 418,168 relations
- [x-englishwordnet/json](https://github.com/x-englishwordnet/json) — JSON releases

### Wiktextract / kaikki.org
- [kaikki.org — raw data downloads](https://kaikki.org/dictionary/rawdata.html) — raw Wiktextract JSONL 22.9 GB (2.6 GB gz); **Simple English extract 35.5 MB (4.4 MB gz)**; audio bulk download 20.4 GB / ~942,000 files / ~99.5% coverage; per-language extracts. Data extracted 2026-08-07 from the enwiktionary dump dated 2026-08-05
- [kaikki.org — English machine-readable dictionary](https://kaikki.org/dictionary/English/index.html) — 1,385,953 distinct word forms; per-POS sense counts
- [tatuylonen/wiktextract on GitHub](https://github.com/tatuylonen/wiktextract) — data format documentation, `ogg_url` / `mp3_url` fields
- Ylonen, T. (2022). [*Wiktextract: Wiktionary as Machine-Readable Structured Data*](http://www.lrec-conf.org/proceedings/lrec2022/pdf/2022.lrec-1.140.pdf), LREC 2022, pp. 1317–1325

### Wordset Dictionary
- [wordset/wordset-dictionary on GitHub](https://github.com/wordset/wordset-dictionary) — 177k words, 63,936 manual volunteer edits, WordNet-derived
- [LICENSE — CC BY-SA 4.0](https://github.com/wordset/wordset-dictionary/blob/master/LICENSE)
- [wordset-dictionary on npm](https://www.npmjs.com/package/wordset-dictionary)

### GCIDE / Webster's 1913
- [GNU Collaborative International Dictionary of English](https://gcide.gnu.org.ua/) — public domain text derived from Webster's Revised Unabridged 1913
- [GCIDE downloads (GNU FTP)](https://ftp.gnu.org/gnu/gcide/)
- [GCIDE on Wikipedia](https://en.wikipedia.org/wiki/GCIDE)
- [javierjulio/dictionary](https://github.com/javierjulio/dictionary) — GCIDE → structured JSON
- [aviaryan/gcide-dictionary-json](https://github.com/aviaryan/gcide-dictionary-json)
- [Wiktionary:Public domain sources](https://en.wiktionary.org/wiki/Wiktionary:Public_domain_sources)

---

## Client-side / serving architecture

- [phiresky/sql.js-httpvfs on GitHub](https://github.com/phiresky/sql.js-httpvfs) — read-only SQLite over HTTP Range requests
- [Hosting SQLite databases on Github Pages — phiresky's blog](https://phiresky.github.io/blog/2021/hosting-sqlite-databases-on-github-pages/) — the ~1 KB transfer for an indexed lookup against a 670 MB DB; 4096-byte page behaviour
- [sql.js-httpvfs on npm](https://www.npmjs.com/package/sql.js-httpvfs)
- [Client-side search — Jordan Webb](https://jordemort.dev/blog/client-side-search/) — practical notes on static-host Range request support and cache-eviction caveat
- [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) — free tier: 5 GB storage, 5,000,000 rows read/day, 100,000 rows written/day, limits reset 00:00 UTC
- [Cloudflare D1 FAQ](https://developers.cloudflare.com/d1/reference/faq)

---

## Lemmatization

- [wink-lemmatizer](https://winkjs.org/wink-lemmatizer/) — noun/verb/adjective lemmatization, backed by `wink-lexicon`
- [winkjs/wink-lemmatizer on GitHub](https://github.com/winkjs/wink-lemmatizer)
- [takafumir/javascript-lemmatizer](https://github.com/takafumir/javascript-lemmatizer) — WordNet exception files + morphy rules
- [javascript-lemmatizer on npm](https://www.npmjs.com/package/javascript-lemmatizer)
- [spencermountain/compromise](https://github.com/spencermountain/compromise) — full JS NLP with POS tagging

---

## Pronunciation audio & IPA

- [Wiktionary:Audio](https://en.wiktionary.org/wiki/Wiktionary:Audio) — `{lang}-{region}-{word}.ogg` naming convention, Commons storage
- [Help:Audio pronunciations](https://en.wiktionary.org/wiki/Help:Audio_pronunciations)
- [Category:Pronunciation — Wikimedia Commons](https://commons.wikimedia.org/wiki/Category:Pronunciation)
- [Commons:Pronunciation files requests](https://commons.wikimedia.org/wiki/Commons:Pronunciation_files_requests)
- [File:en-us-home.ogg — Simple English Wiktionary](https://simple.wiktionary.org/wiki/File:en-us-home.ogg) — example
- [MDN: SpeechSynthesis API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)

---

## Measured figures — provenance

Every size figure in [`03-embedded-options.md`](03-embedded-options.md) marked "measured" was produced on **2026-08-11** in a Linux sandbox by the scripts in [`prototype/`](prototype/), against `wordnet-db@3.1.14` installed from npm. They are reproducible:

```bash
npm i wordnet-db
python3 build-wordnet-index.py     # → headword/sense counts, JSON, gzip, SQLite sizes
python3 measure-variants.py        # → variant sizes, brotli, per-letter shards
```

Raw output captured:

```
headwords: 147982
senses:    207272
json MB 22.4  gz MB 4.9
sqlite MB 27.3

A single-word, <=3 senses:  83736 headwords | raw 12.1MB | gzip 2.9MB | brotli 2.1MB
B + defs capped 120 chars:  83736 headwords | raw 11.9MB | gzip 2.8MB | brotli 2.0MB
per-letter brotli shards total 2.7MB, avg shard 102KB
variant A sqlite 14.5MB
```

---

## Confidence notes

Flagging where I'm less than certain, so you don't over-trust a number:

| Claim | Confidence | Note |
|---|---|---|
| freedictionaryapi.com: 1,000 req/hr/IP, CC BY-SA 4.0 | **High** | Read directly from their published docs page |
| M-W: 1,000/day/key, non-commercial free, logo required | **High** | Read directly from the M-W FAQ |
| Wordnik pricing tiers | **High** | Read directly from the pricing page |
| Datamuse 100k/day and 2027-01-01 key requirement | **High** | Read directly from the API docs page |
| Oxford from £50/mo billed annually | **High** | Verified verbatim from the Oxford updates page: *"Our new plans start from £50 per month, billed annually"* |
| Cambridge free < 3,000/mo, then £50/mo | **Low-Medium** | ⚠️ From secondary coverage of the API launch. The Cambridge developer pages are client-rendered and returned no content to a plain fetch, so I could **not** confirm current pricing. **Verify directly at [dictionary-api.cambridge.org](https://dictionary-api.cambridge.org/) before relying on it** |
| Words API 2,500/day free | **Low-Medium** | ⚠️ The RapidAPI pricing page is client-rendered and returned no content to a plain fetch. RapidAPI free tiers change often. **Check the live page** |
| Cloudflare D1 free tier limits | **High** | Verified from the live [D1 pricing docs](https://developers.cloudflare.com/d1/platform/pricing/) (page last updated 2026-04-21): 5M rows read/day, 100k rows written/day, 5 GB storage, free limits reset 00:00 UTC, queries blocked when exceeded |
| All WordNet prototype size figures | **High** | Measured directly, reproducible |
| dictionaryapi.dev provenance concern | **Medium-High** | Strong circumstantial evidence — repo name `googleDictionaryAPI` + `ssl.gstatic.com` audio URLs in their own documented sample response. Not a legal determination |
