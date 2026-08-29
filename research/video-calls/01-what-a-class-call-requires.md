# 01 — What a class call actually requires

> **The question:** What are the irreducible parts of a realtime video
> call for a 30-minute class, and which of them does the current site
> already have?

**Short answer:** A call needs four things — signalling, NAT traversal,
media transport, and a way to prove a joiner is allowed in. The site
currently has **none** of them, and cannot have the fourth. **The one
that decides the architecture is not the video: it is that a join token
must be signed by a secret, and a static export has nowhere to keep a
secret.** Everything else in this strand follows from that.

---

## 1. The four parts

A browser-to-browser call is not one system. It is four, and they fail
independently.

| Part | What it does | Can a static site do it? |
|---|---|---|
| **Signalling** | Carries the offer/answer and ICE candidates between the two browsers before any media flows | No — needs a server both sides can reach, usually a WebSocket |
| **NAT traversal** | Finds a path between two machines behind home routers (STUN), or relays when there is none (TURN) | No — STUN can be a public server, TURN cannot realistically be |
| **Media transport** | Moves the encrypted audio/video once a path exists | Yes, for 1:1 — this is the only part that is genuinely peer-to-peer |
| **Admission** | Decides who is allowed into which room, and proves it to the media layer | **No, and this is the hard one** |

The first three are well-trodden and every option in
[`03-provider-options-and-costs.md`](03-provider-options-and-costs.md)
solves them for you. The fourth is where this project's specific
architecture bites.

## 2. Why admission is the load-bearing constraint

Every managed provider works the same way: your server holds an API
secret, and uses it to mint a short-lived token naming the room and the
participant. The client presents that token. LiveKit signs a JWT with
the API secret; Daily and Whereby issue meeting tokens through a REST
call authenticated by an API key. The names differ, the shape does not.

The site is `output: "export"` (`site/next.config.mjs`). Every route is
rendered to HTML at build time and served from `out/`. There is no
request-time code anywhere in the deployment — `vercel.json` even sets
`"framework": null` and `"outputDirectory": "out"`, so Vercel is
deploying a folder of files, not an application.

Putting an API secret into that build would ship it to every visitor. So
**a class call requires at least one piece of server-side code that does
not exist today**, and it requires it before any of the video is
interesting. This is true of the managed options and the self-hosted
ones alike; it is not a consequence of choosing a vendor.

> The one exception is worth naming because it is tempting: Daily and
> Whereby can both create a room whose URL is simply shareable, with no
> token at all. You could create rooms by hand and mail the links. That
> is a real option, it costs nothing, and it is what
> [`05-accounts-and-access.md`](05-accounts-and-access.md) costs out as
> the rejected alternative — rejected because you have decided the site
> should have student accounts, and an account system is a server with
> a secret by definition.

## 3. What the site already has that helps

Reading `site/lib/articles.js` turned up the same kind of thing the
dictionary strand found: the useful structure is already there.

- **Articles are already split into named sections.** `articles.js`
  splits each body at its `##` headings and derives a stable class name
  from the part before the colon — `"Grammar Spotlight: Reported
  Speech"` becomes `grammar-spotlight`. The name is deliberately stable
  no matter which grammar point an article covers.

  That is exactly the addressing scheme a shared article view needs.
  Two browsers at different window sizes cannot agree on a scroll
  offset, but they can agree on `grammar-spotlight`. See
  [`06-shared-article-view.md`](06-shared-article-view.md).

- **A precedent for build-time-only dynamism exists.**
  `site/app/dictionary/[shard]/route.js` is a Route Handler that renders
  to static files under `output: "export"`, via `dynamic = "force-static"`
  and `generateStaticParams()`. Its own comment says removing that one
  line is the entire migration to a live API route.

  It is worth being precise about what that precedent does and does not
  establish. It proves the codebase is comfortable with Route Handlers.
  It does **not** mean a token endpoint can be added the same way:
  `force-static` is what makes the dictionary route legal under static
  export, and a token endpoint is exactly a handler that must read the
  incoming request. Next.js lists "Route Handlers that rely on Request"
  among the unsupported features of `output: "export"`. The dictionary
  route is the shape that works; a token route is the shape that does
  not.

- **The article page renders sections independently**, so an in-call
  layout can reuse the existing rendering rather than reimplementing it.

## 4. What the site has that this feature threatens

The search pipeline. `scripts/postbuild.mjs` runs Pagefind over the
`out/` directory that `output: "export"` produces, then mirrors the
index into `public/pagefind` for dev. `vercel.json` points Vercel at
`out`. `scripts/verify.mjs` gates every push on that exact build.

If the static export goes, `out/` goes, and all four of those things
need rework at once. That is the real price of the obvious approach,
and it is the subject of
[`04-the-static-export-question.md`](04-the-static-export-question.md).

## 5. What this means for sequencing

The order the parts have to be solved in is not the order they appear
in a demo:

1. **Decide where request-time code will live.** Everything else
   depends on it, and the answer is not obviously "in this repo."
2. **Decide the identity model**, because it determines what that code
   has to do beyond minting a token.
3. **Pick a media provider.** This is the reversible decision, and — as
   [`03-provider-options-and-costs.md`](03-provider-options-and-costs.md)
   shows — at your volume it is nearly free whichever way it goes.
4. **Then** build the shared article view, which is the part that makes
   this a teaching tool rather than another meeting link.

Steps 3 and 4 are where the interesting product work is. Steps 1 and 2
are where the project's existing shape actually gets decided, which is
why they come first.
