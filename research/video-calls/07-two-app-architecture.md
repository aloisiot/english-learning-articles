# 07 — Two apps in one repo

> **Added 2026-08-29.** This document did not exist in the first draft.
> It records the architecture decided after reading it — the case where
> the class feature is a **separate server-side application** rather than
> an endpoint bolted onto the static site. That decision supersedes the
> recommendation in [`04-the-static-export-question.md`](04-the-static-export-question.md) §4,
> and the reason it does is worth more than the new answer: `04` reasoned
> from "this feature needs *one* endpoint," and one endpoint does not
> justify a second application. Once scheduling, accounts and a class UI
> are on the roadmap, the premise is different, and the same reasoning
> points the other way.

> **The question:** The class feature becomes its own app in the same
> repo. Where are the seams between it and the articles site, what does
> the split cost, and what does it fail to solve?

**Short answer:** The split costs exactly one thing — the article
content has to cross a boundary — and buys four. Cross content over
**HTTP** (a static JSON endpoint) and code over the **workspace** (a
shared `lib/` package); mixing those up is the only way to get this
wrong. **The split does not solve the Vercel commercial-use question,
which is account-level, not project-level.**

---

## 1. What the split buys

- **Independent evolution.** The articles site is a publishing tool and
  the class app is a live application. They have different release
  cadences, different failure modes, and different reasons to change.
- **The crawler and search index stay clean.** Pagefind indexes `out/`
  from the site build; a separate app contributes nothing to it. `/class`
  can be `noindex` in its entirety without any per-route carve-out, and
  the article corpus remains the only thing search knows about. This was
  the stated motivation and it holds.
- **Blast radius.** `04` argued for keeping the video feature's impact on
  the existing site at zero. A separate app achieves that more completely
  than a separate function did — the site's `next.config.mjs`,
  `postbuild.mjs`, `verify.mjs` and `vercel.json` build settings are all
  untouched.
- **Server-side freedom without negotiation.** No `force-static`
  contortions, no static-export forbidden list. Auth, sessions,
  scheduling and Daily's REST API are ordinary server code.

It also **removes a vendor**. `04` §3 recommended Cloudflare Workers or
Supabase Edge Functions to hold the one endpoint that needs a secret. A
server-side class app *is* that server, so neither is needed. Daily room
creation, meeting tokens and link signing are all local.

## 2. What the split costs

**Article content.** This is the whole cost, and it is real.
`site/lib/articles.js` reads `path.join(process.cwd(), "content")` — it
is hard-wired to the site's working directory and will not work
unmodified from a sibling app.

**Styling and components.** `globals.css` and `dictionary-popover.js`
would otherwise be duplicated, and duplication drifts.

**Version coupling.** A shared package holding React components means
both apps must agree on React and Next versions. The workspace has to
police that; it is not automatic.

## 3. The two seams, and why they are different

The mistake available here is using one mechanism for both concerns.
Content and code cross the boundary differently.

| | Mechanism | Why |
|---|---|---|
| **Article content** | HTTP — the site publishes `/articles/<slug>.json` | Keeps the apps independently deployable; the class app fetches at request time, so new articles appear without redeploying it |
| **Code and styles** | Workspace — a shared `lib/` package | Compile-time sharing; there is no sensible way to fetch a React component over HTTP |

The content endpoint is not a new pattern. `site/app/dictionary/[shard]/route.js`
already publishes JSON from the static site using `dynamic = "force-static"`
and `generateStaticParams()`; an articles endpoint is the same shape
against a different data source. The site gains prerendered files and
nothing else — no server, no change to `output: "export"`.

**The dictionary comes along free.** `/dictionary/<shard>` is *already* a
static JSON endpoint. The class app can fetch it exactly as the article
page does, so in-call word lookup needs no new infrastructure — only the
popover component travels through `lib/`.

**Covers do not cross either seam.** Cover images are an article-
authoring concern: `download-covers.mjs`, `check-cover-queue.mjs` and
`cover-images.json` stay in `site/`, and `workflow:content` /
`workflow:dev` remain site-only commands. Nothing cover-related belongs
in `lib/`.

The rejected alternative was having the class app read `../site/content/*.md`
across folders. It is the least code, and it fails at deployment: a
Vercel project rooted at `class/` must be configured to include files
outside its root directory, and the two apps stop being independently
deployable while still looking as though they are. Cheap to write,
expensive to debug.

## 4. One domain, two apps — and a correction

The class app lives at `/class` on the same domain. Reaching that
requires a rewrite, and there is a distinction that is easy to get
wrong and was got wrong earlier in this strand.

- **`next.config.mjs` rewrites** are on the Next.js static-export
  forbidden list quoted in [`04`](04-the-static-export-question.md) §1.
  Under `output: "export"` they are unavailable.
- **`vercel.json` rewrites** are a *platform* feature, applied by
  Vercel's routing layer before anything is served. They work for any
  project, including one deploying a plain static folder — which, with
  `"framework": null` and `"outputDirectory": "out"`, is exactly what
  `site/` is.

So the articles site keeps the domain. `site/vercel.json` gains a
rewrite sending `/class/:path*` to the class app's stable production
URL, and the class app sets `basePath: "/class"` so its routes and
asset paths line up. This is the arrangement Next.js documents as
Multi-Zones.

Why this matters beyond convenience: the domain does not have to
migrate, article requests are never proxied through the class app, and
if the class app is broken only `/class` is broken. The earlier reading
— that path-based routing would force the dynamic app to front the
domain and sit in the request path of every article page — was wrong,
and it was wrong because it read a Next.js constraint as a Vercel one.
**Confidence: good but unverified.** The external-URL rewrite
destination should be checked against Vercel's own routing
documentation before it is relied on; it is in the register.

## 5. The workspace, and the push gate

npm workspaces at the repo root, with the folder names unchanged:
`site/`, `class/`, `lib/`.

The consequence that lands on deploy config: **the lockfile moves to the
repo root**. `site/vercel.json` currently sets `installCommand: npm ci`
with `site/` as the project root, and that stops being correct — both
Vercel projects keep their own Root Directory but install from the root.

This bears directly on `verify.mjs`, which exists because a lockfile
drifted out of sync and only surfaced when Vercel ran `npm ci`. A shared
lockfile makes that class of failure **more** likely, not less: a change
to `class/package.json` can desynchronise the lockfile that `site/`
installs from.

**Decision: one root `npm ci` always, then build only what changed.**
Per-package builds keep the gate fast; the always-on root install keeps
the hole that `verify.mjs` was written to close from reopening through a
new door. Splitting the gate the other way — running `npm ci` only when
the changed package's manifest changed — would pass locally and fail on
deploy in exactly the original way.

## 6. What the split does not solve

**The Vercel commercial-use question is account-level.** The Fair Use
Guidelines say *"Hobby **teams** are restricted to non-commercial
personal use only."* Two projects under one Hobby team are both bound by
it, so a commercial class app pulls the articles site onto Pro with it.

Separating the apps protects the crawler, the search index and the
deploy surface. It does not partition the billing question, and it
should not be relied on to. [`04`](04-the-static-export-question.md) §5
stands unchanged: ask Vercel before building.

## 7. The shape of phase 1

Recorded here because it is what the split makes possible:

- **No database.** The signed link encodes article slug, room name and
  expiry; the class app verifies the HMAC. Nothing is stored anywhere.
- **Daily rooms created lazily**, with the room name derived from the
  link and Daily's own expiry property set to the class end time. This
  is also the mitigation [`03`](03-provider-options-and-costs.md) §6
  asked for against Daily's absent spend cap — rooms self-destruct
  rather than lingering, and it falls out of the stateless design
  rather than being extra work.
- **An admin page behind a shared secret** generates links. This is
  honestly a small auth system, and phase 1 therefore does not have
  *zero* auth surface — it has a deliberate small one, in exchange for
  not needing a terminal to start a class. It needs `noindex`, rate
  limiting, a strong secret and an unguessable path, and it stays
  stateless if it re-checks the secret per submission rather than
  issuing a session.
- **Accounts deferred.** Nothing above is thrown away when they arrive:
  the token-minting path is identical, with a session check replacing a
  signature check. See [`05`](05-accounts-and-access.md) §4.
