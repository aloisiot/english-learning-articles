# 07 — Caching definitions in the repo, and attribution

> **The questions:** can API definitions be stored in the repository, so a word is never requested twice — saving requests and avoiding rate limits? And what does attribution actually require for each source?

**Short answer:** **Yes for Wiktionary-derived data — it's explicitly licensed for exactly this.** No for Merriam-Webster: their terms prohibit automated and recorded queries without written approval, which **invalidates a recommendation I made in [`05-implementation-plan.md`](05-implementation-plan.md)**. Attribution obligations differ sharply by source and are itemised in §3.

---

## 1. ⚠️ Correction: the Merriam-Webster plan doesn't survive its own licence

`05-implementation-plan.md` step 10 said to backfill Merriam-Webster over several days at 1,000/day and **commit the response cache**. I checked the [Merriam-Webster Terms of Service](https://dictionaryapi.com/info/terms-of-service) directly while answering your Q2. Clause 5:

> **5. PROPRIETARY RIGHTS; RESTRICTIONS.** […] you agree not to: **(a) submit any automated or recorded queries to the Service unless otherwise approved in writing by Merriam-Webster and its licensors**; […] (d) copy, reproduce, distribute, or in any other manner duplicate the Software, in whole or in part; […] **(j) knowingly take any action that would cause any part of the Licensed Application to be placed in the public domain.**

Three separate problems with what I recommended:

| Clause | The conflict |
|---|---|
| **5(a)** automated **or recorded** queries | A build script looping over 4,000 words is automated by definition. "Recorded" reads directly onto caching responses to disk |
| **5(j)** public domain | Committing M-W definitions to a public GitHub repo publishes them |
| **5(d)** duplicate/distribute | Arguably about "the Software" rather than returned content, but not a distinction to lean on |

I'm not a lawyer and this isn't legal advice, but 5(a) is unambiguous enough that the safe reading is: **the build-time batch-and-cache strategy is not available for Merriam-Webster.** The free tier is designed for live per-user lookups, not corpus construction.

**This was a real error on my part** — I read M-W's FAQ (query limits, commercial use, logo) but not the ToS, and built a plan on the gap. It's corrected in `02-api-options.md` and `05-implementation-plan.md`.

### What this leaves

| Source | Batch-fetch at build? | Commit to repo? | Redistribute? |
|---|---|---|---|
| **Wiktionary / wiktextract / kaikki** | ✅ Yes — bulk dumps published for this purpose | ✅ Yes | ✅ Yes, under CC BY-SA 4.0 |
| **WordNet (Princeton)** | ✅ Yes — distributed as a database | ✅ Yes | ✅ Yes, with the notice |
| **freedictionaryapi.com** | ⚠️ Technically yes (CC BY-SA data), but see §2 courtesy note | ✅ Yes | ✅ Yes, CC BY-SA 4.0 |
| **Merriam-Webster** | ❌ **No** — clause 5(a) | ❌ No | ❌ No |
| **Oxford / Cambridge / Wordnik** | ❌ Assume no without checking each ToS | ❌ No | ❌ No |

Conveniently, this reinforces [`06-lookup-scope.md`](06-lookup-scope.md) §3: the sources that permit what you want are exactly the ones worth embedding. **Dropping Merriam-Webster costs less than it looks like**, because the Learner's-quality gloss you actually wanted is already being written by hand in each article's `## Key Vocabulary`.

---

## 2. Answering Q2 properly

> *"In case of storing word's definitions from an API, can them be stored in the repository, so there is no need for requesting it twice, saving API requests and preventing case of rate limits?"*

**Yes — for Wiktionary-derived data this is the correct design**, and it's the mechanism that makes the whole "zero cost, no rate limits" goal real rather than aspirational.

### How

```
site/data/dictionary-cache.json        ← committed. word → raw API response
site/scripts/build-dictionary.mjs      ← reads cache, fetches only misses,
                                          writes cache back, emits shards
site/public/… or app/dictionary/…      ← generated shards (build output)
```

Rules that make it work:

| Rule | Why |
|---|---|
| **Commit the cache, treat it as source** | CI, Vercel and fresh clones must build without network access to the API. A vendor outage must not break a deploy |
| **Only fetch cache misses** | Adding one article fetches ~50 words, not 4,000 |
| **Generated shards: build output, not committed** | Derivable from the cache. Committing both invites drift. (Commit them only if you want builds to work with no build step at all) |
| **Record `fetched_at` and the source per entry** | Lets you re-fetch selectively later, and is needed for honest attribution |
| **Cache negative results too** | Otherwise every build retries the same 200 words that have no entry |
| **Rate-limit the fetcher** | Stay under 1,000/hour with a delay between requests; resume from cache on interrupt |
| **Never fail the build on a fetch error** | Fall back to the embedded layer and warn. See the `MW_KEY` guardrail already in `05-implementation-plan.md` |

### The courtesy point

Harvesting a complete dictionary through freedictionaryapi.com would mean ~80,000 requests. At their published 1,000/hour that's **80 hours of continuous fetching against a free service run by one operator with no funding model disclosed**. It's within the letter of the limit and clearly against its spirit.

**For bulk, go to the source: [kaikki.org](https://kaikki.org/dictionary/rawdata.html) publishes the same data as downloadable dumps precisely so people don't hammer APIs for it.** Use the API for what it's good at — incremental lookups of the few hundred words per new article, and live long-tail fallback.

---

## 3. Attribution, per source

You asked for a better explanation than the checklist in [`04-selection-ui.md`](04-selection-ui.md). The obligations differ in kind, not just in wording.

### WordNet (Princeton) — permissive, notice required

Not a Creative Commons licence; a bespoke permissive one, [OSI-recognised](https://opensource.org/license/wordnet). It grants use, copying, modification and distribution "for any purpose and without fee or royalty", including commercial, on three conditions:

1. **The copyright notice must appear on all copies**, including modified ones and internal use. A derived JSON index counts as a copy.
2. **You may not use Princeton's name in advertising or publicity** relating to distribution.
3. Title to copyright stays with Princeton.

**No share-alike.** Your derived index doesn't have to be openly licensed. This is the least demanding option.

*What to show:* the notice, in an About-the-dictionary page or a repo `NOTICE` file:

> WordNet 3.0 Copyright 2006 by Princeton University. All rights reserved.
> [Licence terms](https://wordnet.princeton.edu/license-and-commercial-use)

Princeton also asks for a citation in academic use — not applicable here, but a link is polite.

### Wiktionary / wiktextract / kaikki — dual-licensed, share-alike bites

> **Re-verified 2026-08-11 against the [CC BY-SA 4.0 legal code](https://creativecommons.org/licenses/by-sa/4.0/legalcode) and [Wiktionary:Copyrights](https://en.wiktionary.org/wiki/Wiktionary:Copyrights).** The earlier version of this section was directionally right but **incomplete in three ways** — corrected below and marked ⚠️.

**⚠️ Correction 1 — it's dual-licensed.** Wiktionary entry text is released under **both CC BY-SA 4.0 and the GFDL**, not CC BY-SA alone as this doc previously said. kaikki.org states its data carries the same licences as Wiktionary. In practice you pick one and comply with it; **CC BY-SA 4.0 is the sensible choice** (freedictionaryapi.com declares CC BY-SA 4.0 in every response's `source.license`). Worth knowing the GFDL option exists, because its "transparent copy" obligation is where Wiktionary's "link back to the article" guidance comes from.

**The extraction itself is explicitly permitted.** CC BY-SA 4.0 §4(a) removes any doubt about database rights:

> "for the avoidance of doubt, Section 2(a)(1) grants You the right to **extract, reuse, reproduce, and Share all or a substantial portion of the contents of the database**"

**Share-alike applies to your derived index — and §4(b) says so precisely:**

> "if You include all or a substantial portion of the database contents in a database in which You have Sui Generis Database Rights, then **the database … (but not its individual contents) is Adapted Material**, including for purposes of Section 3(b)"

That is exactly this case, and it confirms the scope claim this doc made:

- The **dictionary data files** — the cache, the generated shards — are Adapted Material and must be offered under CC BY-SA 4.0 (or a compatible licence).
- **Your site code, article text and Key Vocabulary are unaffected.** The licence attaches to the derived *database*, and §4(b)'s parenthetical "(but not its individual contents)" reinforces that it doesn't leak sideways into unrelated material.

**⚠️ Correction 2 — the trigger is the deployed site, not the repo.** The earlier framing tied share-alike to "committing to a public repo". Wrong emphasis. The obligation attaches to **Share**, defined in §1(11) as making material available to the public "in ways that members of the public may access the material from a place and at a time individually chosen by them". **Serving dictionary shards to browsers from Vercel is Sharing** — so attribution and share-alike apply whether or not the GitHub repo is public.

**⚠️ Correction 3 — two required attribution elements were missing.** §3(a)(1) lists what you must retain when Sharing, including in modified form. The full set:

| § | Requirement | Was it in this doc before? |
|---|---|---|
| 3(a)(1)(A)(i) | Identify the creator(s) | Yes |
| 3(a)(1)(A)(ii) | A copyright notice | Yes |
| 3(a)(1)(A)(iii) | A notice referring to the licence | Yes |
| 3(a)(1)(A)(iv) | **A notice referring to the disclaimer of warranties** | ❌ **missing** |
| 3(a)(1)(A)(v) | A URI or hyperlink to the licensed material | Yes |
| 3(a)(1)(B) | **Indicate that you modified the material** | ❌ **missing** |
| 3(a)(1)(C) | State it's under CC BY-SA and link the licence text | Yes |
| 3(b)(2) | Include the URI of the Adapter's Licence you apply | Partly |
| 3(b)(3) | Impose no additional restrictions or DRM on the adapted material | ❌ missing |

Extracting Wiktionary into a restructured index **is** modification, so 3(a)(1)(B) definitely applies. §3(a)(2) allows all of this to be satisfied "by providing a URI or hyperlink to a resource that includes the required information" — so **one About-the-dictionary page carrying the full statement, linked from the footer, satisfies the lot.**

*Corrected wording, covering every element above:*

> **Dictionary data.** Definitions, pronunciations and examples are extracted from
> [Wiktionary](https://en.wiktionary.org/), © Wiktionary contributors, and are used
> under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
> **The data has been modified**: extracted with
> [wiktextract](https://github.com/tatuylonen/wiktextract), filtered to a subset of
> entries, and restructured for lookup. The resulting dataset is likewise offered
> under CC BY-SA 4.0. It is provided **as-is and without warranties**, per section 5
> of the licence. Each entry links to its source page on Wiktionary.

Plus a `LICENSE` file naming CC BY-SA 4.0 in the dictionary-data folder.

If you use **freedictionaryapi.com** as the fetch mechanism, they additionally ask for a visible credit to FreeDictionaryAPI.com and a link back to the Wiktionary page. Once you move to kaikki dumps only the Wiktionary attribution is required — but crediting wiktextract is deserved either way, and kaikki asks for a link and (for academic use) a citation of [Ylonen 2022](http://www.lrec-conf.org/proceedings/lrec2022/pdf/2022.lrec-1.140.pdf).

### Merriam-Webster — moot, but for the record

If you ever use it live (no caching, no batch): every application must display the **Merriam-Webster logo** per their [brand guidelines](https://dictionaryapi.com/info/branding-guidelines), and clause 7 forbids using the trademarks in a way implying affiliation or endorsement. Free tier is non-commercial only.

### Wikimedia Commons audio — per file, and credit the creator not the uploader

Each recording carries its **own** licence (CC BY-SA, CC BY, CC0 — varies) and its **own** author. There is no blanket credit line.

⚠️ Per [Commons:Reusing content outside Wikimedia](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia): where the uploader is not the content creator, **it is the creator who must be credited**, not the uploader. And where the copyright holder specifies how to attribute, those instructions take precedence over any generic formula.

If you self-host audio you must capture licence + creator per file at download time and surface them. `scripts/download-covers.mjs` already solves exactly this problem for cover images — `cover_image_credit` in the front matter is the same pattern. Reuse it.

**This is a real ongoing cost**, and it's the main argument for keeping `speechSynthesis` as the Phase 1 audio source: it has no attribution burden at all.

### Datamuse — courtesy only

Asks for acknowledgement in your documentation. Not a licence condition.

### Where attribution should live

Following the conventions already in this repo:

| Placement | What goes there |
|---|---|
| **`docs/dictionary.md`** or an About-the-dictionary page | The full statement: sources, licences, the Princeton notice, the CC BY-SA declaration |
| **Site footer** | One line linking to the above |
| **Each popover** | A per-entry link to the source page — this *is* the BY attribution, and it's useful |
| **Repo** | `LICENSE` / `NOTICE` in the dictionary-data folder |

Mark the site-side attribution `data-pagefind-ignore`, consistent with `.cover-credit` and `.meta` in `app/articles/[slug]/page.js`, so it never appears in search excerpts.

---

## 4. Consequences for the plan

| Doc | Change |
|---|---|
| `02-api-options.md` | M-W marked as unusable for build-time caching |
| `05-implementation-plan.md` | Step 10's "backfill M-W and commit the cache" removed; the optional-M-W section corrected |
| `06-lookup-scope.md` | Reinforced — the redistributable sources are the ones worth embedding |

The plan gets simpler. No API key to manage, no `MW_KEY` guardrail, no non-commercial constraint on the site's future, no logo requirement. The quality that M-W would have added is largely already supplied by the hand-written `## Key Vocabulary` layer.

---

**Sources:** see [`08-sources.md`](08-sources.md).
