# Dictionary research notes

This document is not a bootstrap for the implementation, it drives a short discussion before diving into the implementation phase.

> **Answered 2026-08-11. Resolved 2026-08-11.** Responses live in the numbered
> docs, per section below.
>
> | Raised here | Status | Where |
> |---|---|---|
> | Hybrid approach + search integration | ✅ Confirmed | [`06-lookup-scope.md`](06-lookup-scope.md) §1 |
> | Q1 — multiword strategy | ✅ Answered — no enumeration needed | [`06-lookup-scope.md`](06-lookup-scope.md) §2 |
> | Q2 — storing definitions in the repo | ✅ Yes, for openly-licensed data only | [`07-caching-and-licensing.md`](07-caching-and-licensing.md) §2 |
> | Q3 — complete dictionary on the search page | ✅ Yes, technically unremarkable | [`06-lookup-scope.md`](06-lookup-scope.md) §5 |
> | Decision: mobile panel + button position | ✅ **Settled** — panel on all devices, with hysteresis | [`04-selection-ui.md`](04-selection-ui.md) §2a |
> | Decision: auto-focus the "Define" button | ✅ **Settled — auto-focus dropped.** Tab order + keyboard shortcut + `aria-live` | [`04-selection-ui.md`](04-selection-ui.md) §2a |
> | Attribution detail | ✅ Itemised per source | [`07-caching-and-licensing.md`](07-caching-and-licensing.md) §3 |
> | Decision: WordNet 3.1 as embedded corpus | ⚠️ **Reversed** — ships on **Wiktextract**; WordNet is scaffolding only | [`06-lookup-scope.md`](06-lookup-scope.md) §3 |
>
> **Withdrawn:** the earlier plan to batch-fetch and cache **Merriam-Webster** breaches
> their [ToS clause 5(a)](https://dictionaryapi.com/info/terms-of-service). M-W is out of the
> design entirely — [`07-caching-and-licensing.md`](07-caching-and-licensing.md) §1.
>
> **✅ Everything is now settled.** The remaining decisions — search tab in v1,
> corpus, audio, licensing, keyboard shortcut — were taken on 2026-08-11 and are
> recorded in [`README.md`](README.md) under *Final decisions*, with the open-question
> log in [`doublecheck-report.md`](doublecheck-report.md) §4.
>
> One decision was **mine rather than yours**: shipping the search tab in v1 while
> using WordNet conflicts, so the two surfaces were given different layer orders
> instead of delaying either. Flagged in [`06-lookup-scope.md`](06-lookup-scope.md) §7.

## Hibrid aproach (Embedded dictionart + API + Cache)

The API + cache is a good aproach considering the current architecture and only the lookup feature. But integrating the dictionary into the search engine can be a useful feature. In this case, only having definitions for words present in articles sets a huge limit. A hibrid aproach, including an embeded dictionary, can support the search integration, also adding definitions for words that are out of articles, even though API dictionaries can have better definitions (I'm not sure, just guessing). Hel on this decision.

## Quesitons

1. What is the strategy for multiple words lookup? I think it isn't worth to store all possible expressions and word combinations present in all articles. What can be the etrategy for this scenario?
2. In case of storing word's definitions from an API, can them be stored in the repository, so there is no need for requesting it twice, saving API requests and preventing case of rate limits?
3. Can we have a complete English dictionary that can be consulted through a dictionary tab on the search page?

## Decisions

Please, challenge any consideration bellow that can be a bad decision.

- API to use: freedictionaryapi.com.
- Embedded dictionary to use: WordNet 3.1.
- The dictionary build phase does not need to run in the server, it can be restricted to local, or other pipeline piece included in the future.
- Selection based is the choosen lookup strategy.
- For mobile, instead of a popup, a full-width panel must be used. It's position depends on the selection position. If the selected word is above the midle of the screen, then the panel is fixed at the bottom, and vise versa.
- The "Define" button is the best strategy. It's position can follow one of these strategies:
  1. Viewport oriented.
  2. Follow the mobile word definition panel strategy, but horizontaly (left, right orientation depending on the word's position), and for all devices.
- When the "Define" button apears it must be focused, so the user can hit Space or Enter and open the definition, for the sake of accessibility in case of keyboard selection (Shift + Arrow).
- The lemmatization strategy described on [./04-selection-ui.md] is definitely necessary.

## Other considerations

- Please, give me a better explanation of the attribution for each selected dictionary source.
