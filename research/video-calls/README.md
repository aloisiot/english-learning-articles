# Video calls research

**Date:** 2026-08-29
**Question:** What is needed to run a 30-minute English class as a
realtime video call on this site, and where should it start?

**Decisions taken (2026-08-29, before the research):**

- **Call shape:** 1:1 now, small groups later — so don't paint us into a
  corner.
- **In-call scope:** shared article view, screen sharing, in-call text
  chat. **No recording.**
- **Media backend:** undecided — research it.
- **Access:** student accounts with login.
- **What accounts carry:** nothing beyond call access.
- **Volume:** just me, a handful of students.
- **Budget:** up to about $10–20/month.
- **Placement:** inside the site, at a `/class` route.
- **Students:** adults, mixed countries.
- **Devices:** desktop/laptop browsers only.
- **Deliverable:** documents only — no prototype, no implementation plan.

**Decisions taken (2026-08-29, after reading the draft):**

- **Architecture:** the class feature is a **separate server-side
  application** in the same repo, not an endpoint on the articles site.
  Both evolve for their own purpose, and the crawler works independently.
- **Stack:** Next.js, matching the site's React and Next versions.
- **Repo layout:** npm workspaces — `site/`, `class/`, `lib/`.
- **Shared code:** a `lib/` package for CSS tokens and React components.
  **No cover logic** — covers stay in `site/`.
- **Article content:** crosses over HTTP, via a static JSON endpoint the
  site publishes. Not by reading files across folders.
- **Domain:** same domain. `site/vercel.json` rewrites `/class/:path*`
  to the class app; the class app sets `basePath: "/class"`.
- **Provider:** **Daily**.
- **Phase 1:** **temporary signed links, no accounts, no database** — so
  the realtime feature can be tested before anything else is built.
- **Link creation:** an admin page behind a shared secret.
- **Push gate:** one root `npm ci` always, then build only what changed.
- **Accounts:** deferred, not abandoned.
- **`lib/` extraction:** only once a second consumer exists, not up front.
- **Unit tests:** **mandatory**, every phase, with pure logic extracted
  into its own modules and the coverage threshold applied to those
  rather than to the repo. Runner: Vitest.
- **Deliverable (revised):** documents **and a phased plan** —
  [`08-implementation-plan.md`](08-implementation-plan.md). Still no
  code, no prototype.

---

## Contents

| File | What's in it |
|---|---|
| [`01-what-a-class-call-requires.md`](01-what-a-class-call-requires.md) | ⭐ **Start here.** The four parts of a call, why admission is the one that decides the architecture, and what the repo already has. |
| [`02-p2p-vs-sfu.md`](02-p2p-vs-sfu.md) | Whether starting 1:1 justifies building peer-to-peer first. It does not. |
| [`03-provider-options-and-costs.md`](03-provider-options-and-costs.md) | Daily, LiveKit, Whereby, self-hosting and raw WebRTC, costed against a stated volume model. Daily chosen. |
| [`04-the-static-export-question.md`](04-the-static-export-question.md) | What `/class` costs `output: "export"`, and the Vercel clause that costs more than the video does. §4 superseded by `07`. |
| [`05-accounts-and-access.md`](05-accounts-and-access.md) | What accounts cost, the signed-link alternative costed in full, and the GDPR surface. Links-first was taken. |
| [`06-shared-article-view.md`](06-shared-article-view.md) | The part that isn't commodity: syncing section identity, not scroll position. |
| [`07-two-app-architecture.md`](07-two-app-architecture.md) | The two-app split: what it buys, the two seams, the routing correction, and the shape of phase 1. |
| [`08-implementation-plan.md`](08-implementation-plan.md) | Six phases with deliverables, tests and stop conditions. The realtime milestone is Phase 3. |
| [`09-sources.md`](09-sources.md) | Claim-to-source map, repository files read, and the **unverified register**. |

---

## The answer in one page

### The video is the easy part, and it is free

At a handful of 1:1 classes a week, a class costs **60
participant-minutes** and a month costs roughly **1,920**. Daily's free
tier is 10,000 participant-minutes a month; LiveKit Cloud's is 5,000.
The feature fits inside a managed provider's free tier with several
times the headroom to spare.

This removes price from the build-vs-buy question entirely, and once
price is gone, self-hosting has nothing left: a VPS for a media server
and TURN costs **more per month than $0**, before counting a day of
setup and an indefinite maintenance tail. **Daily was chosen** on the
axis that actually varies — free-tier headroom, and the shape of the
cliff past it.

### Admission, not media, is what the architecture turns on

Every provider mints a join token server-side, signed with a secret. The
articles site is `output: "export"` — a folder of files with nowhere to
keep a secret and no request-time code at all. Next.js lists "Route
Handlers that rely on `Request`" and "Cookies" among the features static
export forbids, and those are the two things a class call needs.

So the first decision was never which vendor. It was **where
request-time code lives** — and the answer turned out to be a second
application.

### A separate app is the right shape, and it costs exactly one thing

The class feature is a server-side Next.js app in the same repo. That
leaves the articles site's build, search index, deploy config and push
gate untouched; lets `/class` be `noindex` wholesale; and makes auth,
scheduling and Daily's REST API ordinary server code rather than
contortions around a forbidden-features list. It also removes a vendor —
the class app *is* the server, so no Cloudflare Worker or Supabase
function is needed.

The one real cost is that article content must cross a boundary. **Cross
content over HTTP and code over the workspace**, and never the reverse:
the site publishes `/articles/<slug>.json` from a `force-static` route —
the same pattern `dictionary/[shard]/route.js` already proves — while
CSS tokens and React components travel through a shared `lib/` package.
The dictionary comes along free, because `/dictionary/<shard>` is
already a static JSON endpoint.

### One domain, because `vercel.json` rewrites are not `next.config` rewrites

This strand initially read the Next.js static-export ban on `rewrites`
as a Vercel limitation, and concluded that path-based routing would
force a dynamic app in front of every article page. That was wrong.
`vercel.json` rewrites are platform routing, applied before anything is
served, and they work for a static folder.

So the articles site keeps the domain and rewrites `/class/:path*` to
the class app, which sets `basePath: "/class"`. No domain migration,
no proxy hop for articles, and if the class app breaks only `/class`
breaks. The lesson generalises: *"Next.js cannot do X"* and *"Vercel
cannot do X"* are different claims about the same word.

### Phase 1 has no database, and that is the point

Signed links encode the article slug, room name and expiry; the class
app verifies the HMAC. Daily rooms are created lazily with Daily's own
expiry set to the class end time — which also fixes the one risk `03`
flagged, that Daily has no hard spend cap and a forgotten room bills
quietly.

Links are generated from an admin page behind a shared secret. That is
honestly a small auth system, so phase 1 does not have *zero* auth
surface; it has a deliberate small one, and it needs `noindex`, rate
limiting and an unguessable path. Nothing here is thrown away when
accounts arrive: the token path is identical, with a session check
replacing a signature check.

### The budget is consumed by hosting, not by video — and the split does not fix that

Vercel's Fair Use Guidelines restrict Hobby **teams** to non-commercial
personal use, with a definition broad enough to include "receiving
payment to create, update, or host the site." That clause is written at
team level, so two projects under one Hobby account are both bound by
it: separating the apps protects the crawler and the deploy surface, not
the billing question.

If it applies, Vercel Pro is **$20/month** — the whole stated budget,
spent before a single video minute. **Ask Vercel Support before
building.** It is a free question with a $240/year answer.

### The part worth building is the part that is nearly free

`site/lib/articles.js` already splits every article at its `##` headings
and derives a stable name from each — `"Grammar Spotlight: Reported
Speech"` becomes `grammar-spotlight` — and `docs/class-structure.md`
gives every article the same skeleton. So the two browsers already share
a vocabulary. **Sync section identity, not scroll offsets**, over
Daily's own data channel, teacher-led with student detach.

Section names cross an HTTP boundary as easily as a function call, which
is why the split costs this feature nothing. It gains something instead:
a class app fetching article JSON is free to render a purpose-built
teaching view — a section stepper sized for a call — rather than a
scrolling article page with video attached.

### Recommended order

Expanded, with deliverables, tests and stop conditions, in
[`08-implementation-plan.md`](08-implementation-plan.md). In brief:

**Reorganised 2026-08-30** against `SESSION-2026-08-30.md` and the repo
as built. Phases 1–3 exist in code; **neither of their acceptance gates
has been closed** — nothing is deployed and no real call has run — so
the remaining phases are renumbered from 4.

| Phase | State | What exists at the end |
|---|---|---|
| **1** | ✅ done | The workspace and the test harness. Plus an unplanned env-safety subsystem, after a near-miss with a real API key. |
| **2** | ⚠️ built, ungated | The class app and the `/class` rewrite are configured. **The Vercel account has zero projects.** |
| **3** | ⚠️ built, ungated | Signed links, admin page, Daily join — nine tested modules. **No two-person call has run.** |
| **4** | next | **Deploy, and close both skipped gates.** They merged: a student cannot join a localhost. |
| **5** | | The article beside the call, over the JSON seam. Now also handles a class with no article. |
| **6** | | Section sync and `lib/`. Chat and screen sharing already shipped, out of order. |
| **7** | | Accounts. |

The correction the session forced: **the gates were the plan, not the
phases.** Skipping one does not remove it — it moves it, with interest,
into the phase that finally has to close it. Phase 4 now carries four
unknowns that would each have been cheaper alone.

---

## What this strand did not establish

Fifteen items are listed in the register at the end of
[`09-sources.md`](09-sources.md), sorted with the most load-bearing
first. The four that could change a recommendation:

1. Whether Vercel would call the class app commercial, and whether that
   pulls the articles site onto Pro with it. The $20/month conclusion
   rests on it.
2. Whether a `vercel.json` rewrite can target another project's
   production URL, and whether `basePath` composes with it. The entire
   same-domain arrangement rests on it.
3. What Daily does past 10,000 free minutes in practice, and whether a
   lazily created room bills before anyone joins.
4. Whether npm workspaces installs work cleanly with per-project Vercel
   Root Directories — the setting the push gate now depends on.

**No measured basis.** Nothing was run: no build, no script, no browser,
no provider account, and nothing was deployed. The deliverable was
agreed as documents only, so every figure here is read off a vendor's
page, read out of this repository, or arithmetic on the volume model
stated in [`03`](03-provider-options-and-costs.md) §1. The volume model
is an assumption, not a measurement, and every cost conclusion scales
with it.

**The 2026-08-29 architecture revision fetched no new sources.** It is
reasoning over what was already gathered, which is why several of the
new register entries are marked inferred rather than verified.
