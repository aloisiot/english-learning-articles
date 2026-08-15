# Doublecheck report — dictionary strand

**Date:** 2026-08-11
**Scope:** independent verification of every licensing claim in the strand, plus a
sweep for unresolved questions before implementation starts.
**Counterpart:** the strand's numbered docs. Per the convention in
[`../content/README.md`](../content/README.md), **anything found here has already been
written back** into `07-caching-and-licensing.md` and `04-selection-ui.md` — this file
is the record of the pass, not the home of the findings.

**Temporary.** Delete when implementation begins; the corrections live in the
numbered docs.

---

## 1. Verdict

**No blockers.** The design is legally sound as written. Three attribution
requirements were missing and one framing was wrong; all four are corrected in
[`07-caching-and-licensing.md`](07-caching-and-licensing.md) §3.

**✅ All six open questions were resolved on 2026-08-11** — see §4. The research
strand is closed and ready to implement.

---

## 2. Licensing claims — verification log

Every claim re-checked against the primary source, not against my own earlier notes.

| # | Claim | Source checked | Result |
|---|---|---|---|
| 1 | M-W forbids automated/recorded queries | [M-W ToS](https://dictionaryapi.com/info/terms-of-service), clause 5(a), read in full | ✅ **Confirmed verbatim.** Quote is accurate |
| 2 | M-W forbids placing licensed content in the public domain | Same, clause 5(j) | ✅ Confirmed. Applying it to *returned content* rather than "the Software" remains **my inference** — still labelled as such |
| 3 | WordNet permits commercial use, redistribution, modification, with notice | [Princeton licence page](https://wordnet.princeton.edu/license-and-commercial-use) + `LICENSE` bundled in `wordnet-db@3.1.14` | ✅ Confirmed. Notice required on **all** copies incl. modifications for internal use |
| 4 | WordNet has no share-alike | Same | ✅ Confirmed |
| 5 | Extracting a dictionary from Wiktionary data is permitted | [CC BY-SA 4.0 legal code](https://creativecommons.org/licenses/by-sa/4.0/legalcode) §4(a) | ✅ **Confirmed explicitly** — §4(a) grants the right to "extract, reuse, reproduce, and Share all or a substantial portion of the contents of the database" |
| 6 | Share-alike applies to the derived index | Same, §4(b) | ✅ **Confirmed, with a better citation than I had.** §4(b): a database containing a substantial portion of the contents "is Adapted Material, including for purposes of Section 3(b)" |
| 7 | Share-alike does **not** leak into site code or article text | Same, §4(b) | ✅ Confirmed — "(but not its individual contents)" |
| 8 | Wiktionary data is CC BY-SA 4.0 | [Wiktionary:Copyrights](https://en.wiktionary.org/wiki/Wiktionary:Copyrights) | ⚠️ **Incomplete** — it is **dual-licensed CC BY-SA 4.0 *and* GFDL**. Not wrong, but the doc stated only half of it. Corrected |
| 9 | kaikki.org dumps carry the same licence | [kaikki.org](https://kaikki.org/) | ✅ Confirmed — same licences as Wiktionary; link + academic citation requested |
| 10 | Attribution = credit + link back | CC BY-SA §3(a)(1) | ⚠️ **Materially incomplete.** Two required elements were missing entirely: the **warranty-disclaimer notice** (A)(iv) and the **indication that the material was modified** (B). A third, §3(b)(3) "no additional restrictions", was absent. Corrected |
| 11 | Share-alike triggers on committing to a public repo | CC BY-SA §1(11) definition of *Share* | ⚠️ **Wrong emphasis.** The trigger is making the data available to the public — **the deployed Vercel site does this regardless of repo visibility**. Corrected |
| 12 | Commons audio is per-file licensed | [Commons:Reusing content outside Wikimedia](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia) | ✅ Confirmed, with one refinement: **credit the content creator, not the uploader**, and follow the holder's stated instructions where given. Corrected |
| 13 | freedictionaryapi.com requires credit + Wiktionary link | [freedictionaryapi.com](https://freedictionaryapi.com/) | ✅ Confirmed |
| 14 | Datamuse asks acknowledgement only | [Datamuse API docs](https://www.datamuse.com/api/) | ✅ Confirmed — courtesy, not a licence condition |

**Net effect:** nothing in the plan has to change. The corrections are all to what
the attribution text must *say*, and one clarification about what triggers the
obligation. No source was found to be unusable that wasn't already ruled out.

### Standing caveat

I am not a lawyer and none of this is legal advice. Claims 1–2 (Merriam-Webster)
are the only ones where a reading could reasonably differ, and M-W has been dropped
from the design anyway, so nothing depends on that reading being right.

---

## 3. Repository findings

| Finding | Detail | Action |
|---|---|---|
| **No `LICENSE` file** | The repo has none at root. `"private": true` in `site/package.json` is an npm-publish flag, not a licence statement | Add one before shipping dictionary data. See §4.2 |
| **Footer already exists and is `data-pagefind-ignore`** | `app/layout.js` → `<footer className="site-footer" data-pagefind-ignore>` | ✅ Attribution has a correct home already. No new chrome needed |
| **Remote is `git@github.com:aloisiot/english-learning-articles.git`** | Visibility not determinable from the clone | See §4.2 — though per finding 11 above it matters less than it appears |
| **`@vercel/analytics` is already installed** | `Analytics` and `SpeedInsights` in `layout.js` | Relevant to the lookup-analytics idea in `01-architecture-fit.md` §4 — the mechanism is already there if wanted |

---

## 4. Open questions — ✅ all resolved 2026-08-11

| # | Question | Resolution |
|---|---|---|
| 4.1 | Embedded corpus — WordNet or Wiktextract? | **Wiktextract** ships in v1; WordNet is scaffolding only. *(Revised — see below)* |
| 4.2 | Repo licence and visibility | **Articles all-rights-reserved**; separate `LICENSE` naming CC BY-SA 4.0 in the dictionary-data folder |
| 4.3 | Search-page dictionary tab in the first release? | **Yes, v1** |
| 4.4 | Audio source | **`speechSynthesis` only** in Phase 1 |
| 4.5 | Keyboard shortcut | **`d`** — conflicts with nothing |
| 4.6 | Shard granularity | **Deferred by design** — measure once the corpus is built |

### ⚠️ 4.1 + 4.3 conflicted, and the first resolution was wrong

Shipping the search tab in v1 (4.3) while using WordNet as the v1 corpus (4.1) puts
WordNet's weaknesses directly in front of users: a learner typing `carbon sink` —
the title of a published article — would get nothing.

**First attempt:** give the two surfaces different layer orders, making the search
tab API-first with WordNet as instant render. Preserved both answers at no cost.

**Why that was wrong, on re-examination:** it put the *primary* dictionary experience
on a single-operator free API, and meant writing the ingest pipeline twice — once for
WordNet, once for the Wiktextract upgrade that was always coming.

**Current resolution:** ship on **Wiktextract**; use WordNet as **scaffolding** to
build the UI against while the ingest runs as a parallel workstream. The 40-line
parser is throwaway, not lost investment. Reasoning in
[`06-lookup-scope.md`](06-lookup-scope.md) §3, full history in
[`README.md`](README.md).

Both resolutions were my call rather than an explicit choice, so both are flagged
rather than buried. **If the search tab slips out of v1, the earlier answer becomes
correct again** — the trigger is scope, not the corpora.

---

## 5. Items carried forward as unverified

Not blockers, but they should not be treated as settled facts.

| Item | Status | Where it's flagged |
|---|---|---|
| Wiktextract-derived size (~6–10 MB brotli) | **Extrapolated, not measured.** The 3 GB dump could not be downloaded in the research environment | `06-lookup-scope.md` §4, `08-sources.md` |
| Whether `.focus()` on a `<button>` collapses a selection | **Unverified** — documented for text controls only; no browser available to test | `04-selection-ui.md` §2a. **Neutralised by design**: capture the selection string on settle, not on activation |
| Lemmatization failure rate without a forms map (~30–40%) | **General NLP experience, not measured against this corpus** | `04-selection-ui.md` §3 |
| Cambridge and Words API pricing | **Low-medium confidence** — client-rendered pages, could not verify | `08-sources.md`. Irrelevant now: both are out |

The first three are all cheap to resolve during implementation, and each has a
stated fallback that works if the estimate is wrong.

---

## 6. Sources consulted in this pass

- [Creative Commons Attribution-ShareAlike 4.0 International — legal code](https://creativecommons.org/licenses/by-sa/4.0/legalcode) — §1(11) *Share*, §3(a) attribution conditions, §3(b) ShareAlike, §4 Sui Generis Database Rights, §5 warranties
- [Merriam-Webster Dictionary API — Terms of Service](https://dictionaryapi.com/info/terms-of-service) — clause 5
- [Wiktionary:Copyrights](https://en.wiktionary.org/wiki/Wiktionary:Copyrights) — dual licensing, transparent-copy obligation
- [kaikki.org](https://kaikki.org/) — licence and citation statement
- [Commons:Reusing content outside Wikimedia](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia) — creator-not-uploader rule
- [WordNet — License and Commercial Use](https://wordnet.princeton.edu/license-and-commercial-use) and the `LICENSE` bundled in `wordnet-db@3.1.14`
- [freedictionaryapi.com](https://freedictionaryapi.com/) · [Datamuse API](https://www.datamuse.com/api/)
- Repository files: `README.md`, `site/package.json`, `site/app/layout.js`, `git remote -v`, root directory listing
