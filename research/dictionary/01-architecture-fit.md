# 01 — Architecture fit: this Next.js site, static vs server

> **The question:** the site is Next.js with `output: "export"` today, and may evolve into a server-based + SPA Next app. What's the right dictionary architecture for that trajectory?

**Short answer:** build it as a **build-time data pipeline consumed by a client-side popover**. That design is optimal on static export *today* and survives the migration to a server unchanged — because it never depends on which rendering mode you're in. And there is one specific Next.js feature (`force-static` Route Handlers) that lets you write the data-serving layer **once**, in a form that works identically before and after the migration.

---

## 1. What the codebase actually is

Read from the repo on 2026-08-11:

| Thing | Value |
|---|---|
| Framework | Next.js `^16.3.0`, React `^19.2.8`, App Router |
| Output mode | `output: "export"` — fully static, `trailingSlash: true` |
| Hosting | Vercel, Git-push deploys |
| Content | `site/content/*.md`, flat, YAML front matter, read by `lib/articles.js` |
| Markdown pipeline | `gray-matter` → `remark` + `remark-html`, **async, at build time**, split into `##` sections |
| Rendering | Server Components; body injected via `dangerouslySetInnerHTML` per section |
| Search | Pagefind, run as a **postbuild step** over the built HTML in `out/` |
| Gate | `npm run verify` → content checks + `npm ci` + production build, wired to `.git/hooks/pre-push` |

Four properties of this codebase matter more than anything in the generic research:

**a) There is already an async, build-time content pipeline.** `getArticle()` in `lib/articles.js` is `async`, reads from disk, and transforms markdown into rendered section HTML. A dictionary enrichment step doesn't need new infrastructure — it needs a few more lines in a pipeline that already exists and already does exactly this kind of work.

**b) There is already a postbuild precedent.** `scripts/postbuild.mjs` runs Pagefind over `out/` and mirrors the index into `public/` for dev. A dictionary index generator is the same shape of thing, and there is an obvious place to put it.

**c) There is already a verification gate.** `check-content.mjs` validates that front-matter asset paths resolve. Dictionary coverage is exactly the same class of check, and `verify.mjs` is where it belongs. Nothing should be able to reach production with a broken dictionary index.

**d) Every article already has a hand-written `## Key Vocabulary` section.** Real example from `2026-08-07-ai-power-hunger.md`:

> - **bottleneck** — the point where a process is most restricted. *Manufacturing capacity was the bottleneck, not demand.*
> - **strain** — pressure that risks causing damage or failure. *The heatwave put enormous strain on the grid.*

That is a curated, context-specific, pedagogically-pitched gloss with an example sentence — **better than anything Merriam-Webster, Wiktionary or WordNet will return for those words**, because it's written for this reader, about this text. It's already parsed into a section by `splitSections()`. Treating it as the highest-priority dictionary source is nearly free and materially improves quality. My original research missed this entirely.

---

## 2. What `output: "export"` actually permits

Verified against the [Next.js 16.3.0 static export docs](https://nextjs.org/docs/app/guides/static-exports) (page version `16.3.0`, last updated 2026-08-09 — the same major as this project).

### Supported

| Feature | Relevance here |
|---|---|
| **Server Components** | Run during `next build`. Can `fetch()` external APIs, read `process.env`, hit the filesystem. **Secrets never reach the client.** |
| **Client Components** | Prerendered to HTML, then hydrate. Browser APIs available inside `useEffect`. |
| **Route Handlers with `export const dynamic = 'force-static'`** | ⭐ **Render to static files at build time.** `app/data.json/route.ts` emits a real `data.json`. GET only. |
| **Client-side fetch / SWR** | Full SPA-style client data fetching already works — no migration needed for that. |

### Not supported

Route Handlers that read `Request` · `cookies()` · `headers()` · rewrites · redirects · Proxy/middleware · **ISR** · Server Actions · Draft Mode · Intercepting Routes · `next/image` default loader · dynamic routes without `generateStaticParams()`.

### The consequence for dictionary APIs

| Option | At **runtime** on static export | At **build time** on static export |
|---|---|---|
| Merriam-Webster (key) | ✗ Impossible — no server to hide the key | ✅ **Works.** Build script/Server Component reads `process.env.MW_KEY`, bakes results into static output |
| Cambridge / Oxford / Wordnik (key) | ✗ Same | ✅ Same |
| freedictionaryapi.com (no key, CORS) | ✅ Works — direct browser call | ✅ Works |
| Wiktionary / Wikimedia (no key, CORS) | ✅ Works | ✅ Works |
| Embedded WordNet / local corpus | ✅ Works | ✅ Works |

**This is the finding that resolves the whole question.** "Static export can't use keyed APIs" is true only at *runtime*. At *build time*, every keyed API in [`02-api-options.md`](02-api-options.md) is fully available, and the key stays on the build machine. Since your vocabulary is a finite, slowly-growing set, build time is where you want those calls anyway — as argued in [`05-implementation-plan.md`](05-implementation-plan.md).

**Static export does not block a single thing this feature needs.**

---

## 3. ⭐ The upgrade-path trick: `force-static` Route Handlers

This is the concrete answer to "design for static now, work on a server later."

Write the dictionary's data layer as a Route Handler:

```js
// site/app/dictionary/[shard]/route.js
import { loadShard, shardIds } from "@/lib/dictionary";

// On `output: "export"` this renders to a static file at build time.
// Remove this one line after migrating to a server and it becomes a live route.
export const dynamic = "force-static";

export function generateStaticParams() {
  return shardIds().map((shard) => ({ shard }));
}

export async function GET(_request, { params }) {
  const { shard } = await params;
  return Response.json(loadShard(shard));
}
```

| | Today (`output: "export"`) | After migrating to a server |
|---|---|---|
| What happens | Emits `/dictionary/a.json`, `/dictionary/b.json`, … as static files at build | Runs per-request as a real API route |
| Client code | `fetch('/dictionary/a.json')` | **Identical — no change** |
| To switch | — | Delete `export const dynamic = "force-static"`, optionally add caching |

The client never knows or cares. You write the fetch call once, and the same URL is served by a CDN file today and by a function later. **That is the migration path, and it costs one line.**

The alternative — dumping JSON into `public/dict/` — also works and is simpler, but it's a dead end: `public/` files can never become dynamic. The Route Handler costs nothing extra and keeps the door open. Prefer it.

---

## 4. Static vs server, costed

You asked for both options priced out rather than a verdict handed down. Here it is.

### What migrating off `output: "export"` would unlock

| Capability | Worth it for the dictionary? |
|---|---|
| Runtime calls to keyed APIs (M-W, Cambridge) with the key hidden | **No.** Build-time caching gets the same data with better latency, zero rate-limit exposure, and works offline |
| **ISR** — refresh dictionary data without a full rebuild | **Marginal.** Dictionary data changes on the order of months. A rebuild already happens on every article |
| Lookup analytics — which words learners actually check | **The one genuinely valuable unlock.** It would tell you which words to write Key Vocabulary entries for. But a static site can get ~80% of this from a privacy-respecting analytics event, no migration needed |
| Cross-device saved-word sync | **You've said you don't want this feature.** This was the strongest argument for a backend, and it's off the table |
| Personalisation, auth, per-user difficulty | Not in scope |

### What migrating would cost

| Cost | Detail |
|---|---|
| **SEO risk** | `docs/tech-stack-decisions.md` chose SSG *specifically* so crawlers see complete HTML with no JS execution. Proper SSR preserves this. A drift toward client-only SPA rendering would undo the single most deliberate decision in the stack. This is the real risk — not the migration itself, but what it tempts |
| Build/verify complexity | `verify.mjs` reproduces Vercel's build exactly. Server rendering adds runtime behaviour that a build can't fully verify |
| Cold starts / latency | A function call for a definition is slower than an in-memory object lookup. **Strictly worse UX than static for this feature** |
| Runtime failure surface | Static files can't 500. Functions can |
| Cost | Still $0 at this scale on Vercel's free tier, but no longer *structurally* free |

### Verdict

**For a read-only, selection-triggered dictionary with no saved words: migrating buys essentially nothing and costs latency plus a failure mode.** The build-time + client-side design is not a compromise forced by static export — it is genuinely the better architecture for this feature, and would still be the right call on a server.

Two specific triggers that would change this:

1. You decide you want **cross-device saved words** after all (needs auth + DB).
2. You want **per-learner adaptive vocabulary** — tracking which words a specific person has looked up and adjusting articles accordingly.

Neither is on the roadmap. If either arrives, the `force-static` Route Handler above means the dictionary layer is already sitting in the right place.

---

## 5. "Evolve to SPA" — a clarification worth having

The Next.js docs open the static-export page with:

> *"Next.js enables starting as a static site or Single-Page Application (SPA), then later optionally upgrading to use features that require a server."*

Worth being precise about what you'd actually be buying, because "SPA" and "server" are two separate axes:

- **You already have SPA-like navigation.** Client-side route transitions between prerendered pages work today on `output: "export"`. `next/link` navigations don't reload the page.
- **You can already do client-side data fetching** with `useEffect` or SWR against any CORS-enabled endpoint or your own static JSON. That's the SPA part, available now.
- **What actually requires a server** is only the list in §2: request-reading handlers, cookies, headers, redirects, ISR, Server Actions, middleware.

So "evolve to SPA" needs **no migration at all**. Only "evolve to server" does — and per §4, the dictionary doesn't need it.

---

## 6. Codebase-specific gotchas

Things that will bite during implementation, all specific to this repo:

| Gotcha | Why | Handling |
|---|---|---|
| **Pagefind will index injected content** | `postbuild.mjs` indexes built HTML in `out/`. Any dictionary JSON embedded in the page becomes searchable text and pollutes results | Mark any embedded payload `data-pagefind-ignore`, matching the existing convention on `.meta`, `.cover-credit` and `.series-nav` |
| **`dangerouslySetInnerHTML` per section** | Article body HTML is injected, not React-rendered — you can't attach React handlers to individual words | Non-issue for selection-based lookup: one listener on the container reads `window.getSelection()`. This is *why* selection beats per-word wrapping here |
| **`splitSections()` gives you Key Vocabulary for free** | Sections are already named (`key-vocabulary`, `grammar-spotlight`, …) via `sectionName()` | Parse the `key-vocabulary` section at build time into the curated gloss layer |
| **`verify.mjs` is the gate** | Nothing ships without passing it | Add a dictionary-coverage check alongside `check-content.mjs` |
| **`trailingSlash: true`** | Affects emitted paths | A Route Handler at `app/dictionary/[shard]/route.js` emits `/dictionary/a/` — confirm the exact path after first build and fetch accordingly |
| **Selection inside `<code>`/headings** | Readers select anything | Scope the listener to `.article-body`; ignore selections inside `pre`, `code`, and the nav |
| **No `next/image`** | Already documented in `docs/cover-images.md` — the export doesn't run the optimizer | Same constraint applies to any dictionary audio: self-host and pre-process in a script, as `download-covers.mjs` already does for covers |

---

## 7. Where this leaves the rest of the research

| Doc | Status after this analysis |
|---|---|
| [`02-api-options.md`](02-api-options.md) | Still accurate. Reframe: keyed APIs are **build-time** options, not runtime ones |
| [`03-embedded-options.md`](03-embedded-options.md) | Unchanged and now more clearly the right base layer. Option 1 (build-time subset) is the fit |
| [`04-selection-ui.md`](04-selection-ui.md) | Rewritten for **selection-based** lookup; saved-words feature removed per your decision |
| [`05-implementation-plan.md`](05-implementation-plan.md) | Rewritten against this repo's actual files and scripts |
| [`06-sources.md`](06-sources.md) | Extended with the Next.js docs |

---

**Sources:** [Next.js — Static Exports guide](https://nextjs.org/docs/app/guides/static-exports) · [Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route) · [API Routes in Static Export warning](https://nextjs.org/docs/messages/api-routes-static-export) · plus repo files `site/next.config.mjs`, `site/package.json`, `site/lib/articles.js`, `site/app/articles/[slug]/page.js`, `site/scripts/postbuild.mjs`, `site/scripts/verify.mjs`, `docs/tech-stack-decisions.md`. Full list in [`06-sources.md`](06-sources.md).
