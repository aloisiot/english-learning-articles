# 07 — Sources

All URLs verified on **2026-08-29**. Repository state: branch
`research/video-calls`, based on `main` at `19d1f38`.

> **Revised 2026-08-29**, alongside the architecture decisions recorded
> in [`07-two-app-architecture.md`](07-two-app-architecture.md).
> **No new web sources were fetched for that revision.** The two-app
> design, the workspace layout and the routing arrangement are reasoning
> over sources already listed here plus the repository — which is why
> four of the new register entries below are marked as inferred or
> reasoned by analogy rather than read. This document was renumbered from
> `07` to `08` to make room; it remains last-numbered.

---

## Provider pricing

**LiveKit — <https://livekit.com/pricing>** (reached via a redirect from
`livekit.io/pricing`)
Source for: the Build tier's **5,000 WebRTC minutes**, **50 GB
downstream data transfer**, **100 concurrent connections**, and **$0/mo**;
the Ship tier at **$50/mo** with 150,000 WebRTC minutes then **$0.0005/min**;
the Scale tier at **$500/mo**; **end-to-end encryption listed on all
tiers**; and a **standard DPA on all tiers including Build**. Also the
source for the observation that the page states no overage rate for the
Build tier — the "then $X per min" line appears on Ship and Scale only.
Used in `02`, `03`, `05`.

**Daily — <https://www.daily.co/pricing/video-sdk>**
Source for: **10,000 free participant-minutes per month**, the
**$0.004/participant-minute** rate above it, the graduated discount table
(7% at 100k, 15% at 500k, 25% at 1M), audio-only at $0.00099/min, cloud
recording at $0.01349/recorded-minute, and the definition *"A participant
minute refers to a minute for each participant on a call... N × minutes =
participant minutes."* Also the source for the claim in `03` §6 that
Daily has **no hard spending cap**, from the FAQ answer to "Can I set a
spending limit or cap my usage?" Used in `02`, `03`, `06`.

**Whereby Embedded — <https://whereby.com/information/embedded/pricing>**
Source for: the Explore tier's **2,000 participant-minutes/month** with
**"No additional participant minutes"**; the Build tier at **$9.99/month**
including 2,000 minutes then **$0.004/min**; screen sharing and chat
present on all tiers. Used in `03`, `05`.

**Daily pricing index — <https://www.daily.co/pricing>**
Source only for confirming the Video SDK and Pipecat Cloud price lists
are separate products. Used in `03`.

## Platform constraints

**Next.js static exports —
<https://nextjs.org/docs/app/guides/static-exports>**
Version **16.3.3**, page last updated **2026-08-25**, which matches the
`next: ^16.3.0` dependency in `site/package.json`.
Source for: the unsupported-features list quoted in `04` §1 — Route
Handlers that rely on `Request`, Cookies, Rewrites, Redirects, Headers,
Proxy, Server Actions, ISR, dynamic routes without
`generateStaticParams()`. Also the source for the rule that Route
Handlers under `output: "export"` support only `GET` and must declare
`export const dynamic = 'force-static'`, and for the sentence *"If you
need to read dynamic values from the incoming request, you cannot use a
static export."* Used in `01`, `04`.

**Vercel Fair Use Guidelines —
<https://vercel.com/docs/limits/fair-use-guidelines>**
Page last updated **2026-07-29**.
Source for the two passages quoted in `04` §5: that **Hobby teams are
restricted to non-commercial personal use only** and that all commercial
usage requires Pro or Enterprise; and the definition of commercial usage
as any deployment *"used for the purpose of financial gain of anyone
involved in any part of the production of the project,"* with the listed
example *"Receiving payment to create, update, or host the site."* Also
the source for the Hobby usage guidelines (100 GB fast data transfer,
1M function invocations).

> **A defect in what I read.** The fetched version of this page renders
> the donations note as *"Asking for Donations fall under commercial
> usage."* A search summary of the same page rendered it as donations
> **not** falling under commercial usage, which is also what the
> surrounding context implies. The markdown conversion appears to have
> dropped a negation. Nothing in this strand depends on the donations
> question, so I have not resolved it — but it is a warning that this
> page's fetched text is not perfectly faithful, and the two passages
> that *are* quoted in `04` should be re-read on the live page before
> anyone acts on the $20/month conclusion.

**Vercel Pro price** — $20 per developer per month. Taken from the
search result summaries listed below, **not** read on Vercel's own
pricing page. See the register.

## Secondary sources — not verified at primary source

These were reached through search-result summaries only. The underlying
pages were **not** fetched, and every claim drawn from them is hedged
where it appears.

**TURN relay rates** (used in `02` §2). Summary aggregated from
bloggeek.me, nojitter.com, a Medium post by Philipp Hancke,
expressturn.com and forasoft.com. Reported figures: ~15–20% of consumer
sessions, ~22% of conferences in one large aggregate, 30–40% on
restrictive corporate networks, an overall cited range of 4% to 30%+.
No primary study was read; the figures are of unknown vintage and
measure different populations. `02` states this limitation inline.

**Cloudflare Workers free tier** (used in `04` §3): 100,000
requests/day, 10 ms CPU per invocation, paid plan from $5/month.
Search summary only; `developers.cloudflare.com` was not fetched.

**Supabase free tier** (used in `04` §3, `05` §2): 50,000 monthly active
users, 500 MB database, 500,000 edge function invocations, 200
concurrent realtime connections, two projects, and **projects pausing
after ~7 days of inactivity**. Search summary only; `supabase.com/pricing`
was not fetched. The pause claim is load-bearing for a recommendation
and is flagged as such in `05` §2.

**Twilio's video product discontinuation** (mentioned in `02` §5 and
`03` §3 as a vendor-risk illustration): background knowledge, not
verified in this strand. Nothing depends on the date or the details.

## Repository files read

All read on **2026-08-29**. Listed with the claims they support.

| File | Claims it supports |
|---|---|
| `README.md` | Project shape, repo layout, the `workflow:*` commands |
| `docs/overview.md` | Learner profile (B2–C1), status of the site, flat `content/` layout |
| `docs/class-structure.md` | The 30-minute timing budget table quoted in `06` §1 |
| `docs/tech-stack-decisions.md` | That the static-site approach was a recorded decision, not an accident |
| `site/next.config.mjs` | `output: "export"`, `trailingSlash: true` |
| `site/vercel.json` | `"framework": null`, `"outputDirectory": "out"`, `"installCommand": "npm ci"` |
| `site/package.json` | Next `^16.3.0`, React `^19.2.8`, `build` = `next build && node scripts/postbuild.mjs`, `start` = `npx serve out`, no auth or realtime dependency present |
| `site/app/dictionary/[shard]/route.js` | The `force-static` precedent in `01` §3 and `04` §1, including its inline comment about migrating to a live API route |
| `site/lib/articles.js` | The section-splitting and `sectionName()` derivation that `01` §3 and `06` §1 rest on, including the `"Grammar Spotlight: Reported Speech"` → `grammar-spotlight` example, which is quoted from the source comment |
| `site/scripts/postbuild.mjs` | That Pagefind indexes `out/` and mirrors into `public/pagefind` — `04` §2 |
| `site/scripts/verify.mjs` | That the push gate reproduces the production build, and that it exists because of a real failed deploy — `04` §2 |
| `site/lib/pagefind.js` | That the Pagefind runtime is loaded at runtime because it does not exist at build time |
| `site/app/layout.js` | Site chrome, `data-pagefind-ignore` usage, no auth provider in the tree |
| `docs/STYLE-SPEC.md` | Referenced in `06` §4 by name only — **the file itself was not read** |
| Directory listings of `site/app`, `site/lib`, `site/scripts` | That no auth, realtime, or video dependency exists today |

**Files quoted were checked for branch drift.** Several were first read
while the working tree was on `research/audio` rather than `main`. Each
was then compared by object hash between `main` and `research/audio`:
`postbuild.mjs`, `verify.mjs`, `articles.js`, `pagefind.js`, `layout.js`,
`dictionary/[shard]/route.js`, `vercel.json` and `next.config.mjs` are
**byte-identical on both branches**, so every quotation above is accurate
for `main`. The audio strand's additions (`site/lib/speakable.js`,
`site/app/audio-player.js`, and changes to `site/app/globals.css` and
`site/app/articles/[slug]/page.js`) exist only on `research/audio` and
are **not** part of the site this strand describes.

## Nothing was run

No script in this strand was executed, no build was run, no browser was
opened, and no provider account was created. There is no `prototype/`
directory because the deliverable was agreed as documents only. Every
number in this strand is either read off a vendor's page, read out of
the repository, or arithmetic on those two — the arithmetic being the
volume model in `03` §1, which is a stated assumption rather than a
measurement.

---

## The unverified register

Everything this research did not establish, most load-bearing first.
This table is meant to be usable as a to-do list before implementation,
without reading anything else.

**Re-sorted and extended on 2026-08-29** for the two-app architecture.
Items 2, 6 and 10 are new; item 4 (Supabase) dropped down the list
because accounts are deferred; the former item 3 (Pagefind) dropped
because the path it costed is no longer the path being taken.

| # | What is unproven | Why | Where it is leaned on |
|---|---|---|---|
| 1 | **Whether Vercel would classify the class app as commercial use — and whether that pulls the articles site onto Pro with it.** | Not asked. The clause is broad, it is written at *team* level, and Vercel invites the question. | `04` §5 and `07` §6 — the entire $20/month conclusion, and the claim that splitting the apps does not partition the billing question |
| 2 | **Whether a `vercel.json` rewrite can target another Vercel project's production URL, and whether `basePath: "/class"` composes with it correctly for assets.** | Reasoned from the documented distinction between platform routing and Next.js config, and from Multi-Zones existing. Vercel's routing reference was **not** read, and nothing was deployed. | `07` §4 — the entire same-domain arrangement, and with it the claim that the site keeps the domain and the blast radius stays small |
| 3 | **What LiveKit Cloud does when a Build project exceeds 5,000 WebRTC minutes.** | The pricing page states no overage rate for Build; the next plan is $50/mo. Throttle, block or bill is unknown. | `03` §2 — the headroom comparison that picked Daily. Still relevant: LiveKit remains the named fallback |
| 4 | **Whether npm workspaces installs work cleanly with per-project Vercel Root Directories, and what `installCommand` each project needs.** | Not tested. `site/vercel.json` currently assumes a self-contained `site/`. | `07` §5 — the workspace decision, and the push-gate design that depends on where `npm ci` runs |
| 5 | **Whether the free tiers of Daily and LiveKit permit commercial use.** | Neither Terms of Service was read. Given item 1, this is the same question one layer down and could invalidate "the media provider is free." | `03` throughout, `04` §5 |
| 6 | **Daily's room-expiry semantics, and whether a lazily created room is billable before anyone joins.** | Inferred that Daily rooms accept an expiry property; the REST API reference was **not** read. | `07` §7 — the mitigation for Daily's absent spend cap, and the stateless room design |
| 7 | **TURN relay rates.** | No primary study read; blog aggregations of unknown vintage measuring different populations. | `02` §2 — the argument that shipping without TURN fails unpredictably. The *direction* is safe; the numbers are not quotable |
| 8 | **Daily's DPA terms and sub-processor list.** | Not read. Only LiveKit's standard-DPA-on-all-tiers was verified, and LiveKit is now the fallback rather than the choice. | `05` §5 — the GDPR processor analysis, now the only place personal data lands in phase 1 |
| 9 | **That Daily's data channel can carry the message shapes in `06` §2.** | Inferred from the documented existence of `sendAppMessage`; the SDK reference was not read, and no payload size or rate limit was checked. | `06` §3 |
| 10 | **Whether the site can publish `/articles/<slug>.json` under `output: "export"` as cleanly as the dictionary shards do.** | Reasoned by analogy from `dictionary/[shard]/route.js`, which is verified to work. The analogy is strong but was not built. | `07` §3 — the content seam the whole split rests on |
| 11 | **Vercel Pro at $20/developer/month.** | Search summaries only; Vercel's pricing page not fetched. | `04` §5 — the size, though not the existence, of the cost |
| 12 | **Whether Supabase free projects pause after ~7 days of inactivity.** | Secondary summaries only; `supabase.com/pricing` not fetched. Deferred with accounts, but must be re-checked before they are built. | `05` §2 |
| 13 | **Every browser behaviour claim.** | Nothing was run. Desktop-only scope means iOS constraints were excluded rather than tested. | `06` §6 |
| 14 | **`docs/STYLE-SPEC.md` contents.** | Referenced by name; not read. | `06` §4 — the design constraint is asserted from the style's name and the site's appearance elsewhere, not from the spec |
| 15 | **Cloudflare Workers free-tier limits.** | Search summary only. Retained because `04` §3 still costs it as the not-taken option. | `04` §3 |
