# 04 — What a `/class` route costs the static export

> **Revised 2026-08-29.** §4's recommendation — Path B, a token endpoint
> on Cloudflare Workers or Supabase — is **superseded** by
> [`07-two-app-architecture.md`](07-two-app-architecture.md). Not because
> the reasoning was faulty, but because its premise was "this feature
> needs one endpoint," and the decision to build a full server-side class
> app changes that premise. §5 is unchanged and still governs. See also
> the correction in §1 about `vercel.json` rewrites, which are *not* the
> same thing as the `next.config.mjs` rewrites on the forbidden list.

> **The question:** The call has to live at a `/class` route on the
> site. The site is a static export. What does adding request-time code
> actually cost, and does `output: "export"` have to go?

**Short answer:** `output: "export"` does **not** have to go, and the
interesting finding is that removing it is the expensive option rather
than the cheap one — it takes the entire search pipeline with it.
**Keep the static export and host the one endpoint that needs a secret
somewhere else.** The genuinely unavoidable cost is elsewhere again:
Vercel's Hobby plan is non-commercial only, and that clause, not the
video, is what plausibly consumes the whole stated budget.

---

## 1. What `output: "export"` forbids

From the Next.js documentation (v16.3.3, page last updated 2026-08-25),
the unsupported features include:

- Route Handlers that rely on `Request`
- Cookies
- Rewrites, Redirects, Headers
- Server Actions

> **Correction, 2026-08-29.** "Rewrites" here means **`next.config.mjs`
> rewrites**. Vercel's **`vercel.json` rewrites** are a platform routing
> feature applied before anything is served, and they work fine for a
> project deploying a static folder. Reading the Next.js constraint as a
> Vercel one led this strand to overstate the cost of putting a second
> app at `/class` on the same domain; see
> [`07-two-app-architecture.md`](07-two-app-architecture.md) §4. The
> generalisable lesson is that "Next.js cannot do X" and "Vercel cannot
> do X" are different claims about the same word.
- Proxy / Middleware
- Dynamic routes without `generateStaticParams()`
- Incremental Static Regeneration

A join-token endpoint is precisely "a Route Handler that relies on
`Request`" — it must read who is asking and which room. A login session
is precisely "Cookies." So both halves of what this feature needs are on
the forbidden list, and no amount of configuration works around it.

Note the shape of the existing precedent, because it is easy to
misread. `site/app/dictionary/[shard]/route.js` *is* a Route Handler
living happily under static export — but only because it declares
`dynamic = "force-static"` and enumerates its params at build time. It
never reads the request. It is the shape that works, not evidence that
the shape you need works.

## 2. Path A — drop `output: "export"`

Delete one line from `next.config.mjs` and the whole Next.js server
feature set is available: a token route, cookies, sessions, middleware.
This is the obvious move, and the dictionary route's own comment invites
it — *"Removing this line is the entire migration to a live API route."*

For the dictionary, that comment is accurate. For the site as a whole,
it is not, because four other things are built on `out/` existing:

| What | Where | What breaks |
|---|---|---|
| Pagefind indexing | `site/scripts/postbuild.mjs` | Runs `pagefind --site out`. No `out/`, no index. |
| Dev search | same script | Mirrors the built index into `public/pagefind`. |
| Deployment | `site/vercel.json` | `"framework": null`, `"outputDirectory": "out"` — Vercel is told to deploy a folder. Both settings become wrong. |
| The push gate | `site/scripts/verify.mjs` | Reproduces the production build exactly; that is its entire purpose. |
| Local preview | `package.json` → `npx serve out` | Serves a directory that no longer exists. |

Pagefind is the serious one. It works by crawling built HTML files on
disk. A non-export Next build does not produce a browsable `out/`; it
produces `.next/`, whose prerendered HTML lives in a layout that is an
internal implementation detail. **Whether Pagefind can be pointed at a
standard Next.js build, and whether that survives a Next upgrade, I did
not test and do not know.** It is in the unverified register, and it is
load-bearing: search is a shipped feature of this site, and the audio
strand already established how much of the site's behaviour depends on
what Pagefind actually indexed.

So Path A's cost is not "edit one line." It is "edit one line, then
rebuild the search pipeline on an untested foundation, and change the
push gate that exists because a previous deploy broke."

## 3. Path B — keep the static export, move the endpoint

The site stays exactly as it is. The one piece of request-time code —
mint a token, check a session — is deployed as a small function
somewhere else, and the `/class` page calls it from the browser with
`fetch`.

Candidates, both with free tiers that dwarf this use case:

| | Free tier | Fit |
|---|---|---|
| Cloudflare Workers | 100,000 requests/day; 10 ms CPU per invocation | Ample. Signing a JWT is well under 10 ms. |
| Supabase Edge Functions | 500,000 invocations/month | Ample, and co-located with Supabase Auth if that is the identity store |

A class generates a handful of requests. Neither limit is reachable.

What this costs:

- **A second deployment target.** Two places to deploy, two sets of
  secrets. Real, but small, and it is genuinely decoupled — the site
  build never has to know the function exists.
- **CORS.** The `/class` page is on your domain, the function is not.
  One header, configured once.
- **A slightly odd architecture to explain.** Which is what `docs/` is
  for.

What it preserves: `output: "export"`, `out/`, Pagefind, `vercel.json`,
`verify.mjs`, and the property that the whole site is still a folder of
files. Every one of those is a thing that currently works and would
otherwise need re-testing.

## 4. Why Path B, and when to change your mind

**Recommendation: Path B.** Not because it is architecturally prettier —
it is not — but because it makes the video feature's blast radius
exactly zero. If the call feature is abandoned in three months, Path B
leaves the site untouched; Path A leaves a rebuilt search pipeline
behind.

There is a sequencing argument too. Path B is reversible into Path A: if
`/class` grows enough server-side behaviour that a separate function
becomes silly, dropping `output: "export"` then is the same one-line
change, made with the feature already working and its requirements
known. Doing it now means paying Path A's costs before knowing whether
the feature is worth them.

**Change your mind when** the endpoint list grows past two or three, or
when something needs a cookie-based session that the static pages
themselves must read — at which point the static export is fighting you
rather than serving you, and Pagefind's migration is worth doing
properly.

## 5. The cost that actually eats the budget

Vercel's Fair Use Guidelines (page last updated 2026-07-29) state:

> **Hobby teams** are restricted to non-commercial personal use only.
> All commercial usage of the platform requires either a Pro or
> Enterprise plan.

and define commercial usage as any deployment "used for the purpose of
financial gain of **anyone** involved in **any part of the production**
of the project," with listed examples including "Receiving payment to
create, update, or host the site" and "Advertising the sale of a product
or service."

Today the site is a collection of articles, and calling that
non-commercial is comfortable. A `/class` route with student logins,
through which paid English classes are delivered, is a materially
different thing. **Whether Vercel would classify it as commercial is an
inference, not a verified fact** — I have not asked them, and the
guidelines invite exactly that question ("If you are unsure... please
contact the Vercel Support team"). But the clause is broad enough that
the inference is the prudent one.

If it applies, Vercel Pro is **$20 per month**. That is the entire
stated budget, spent on hosting, before a single video minute is billed.

This is the strand's most consequential finding and the one least
related to video:

- The media provider is **free**.
- The auth provider can be **free**.
- The token function is **free**.
- The *hosting you already use* may become **$20/month** because of what
  the feature turns the site into.

It also sharpens the Path A / Path B choice in an unexpected direction:
Path B's function does not have to live on Vercel, so if the commercial
question ever forced a move, a static site is portable to any host in an
afternoon while a Next.js app with server routes is not. Keeping the
export keeps that exit open.

**Recommended action:** before building anything, ask Vercel Support
whether the described deployment counts as commercial use. It is a free
question with a $240/year answer, and it is the cheapest piece of
research left in this strand.
