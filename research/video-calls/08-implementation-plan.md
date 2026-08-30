# 08 — A phased plan

> **The question:** Given docs 01–07, what is the smallest first thing
> worth building, in what order does the rest follow, and how is each
> phase known to be finished?

**Short answer:** Six phases, and **the first two ship nothing a student
can see.** Phase 0 spends a morning closing register items that could
invalidate the architecture; Phase 1 restructures the repo and stands up
a test harness in isolation, because the machinery it touches has broken
a production deploy before. The realtime milestone — the whole point of
going links-first — arrives in **Phase 3**, and it is deliberately
nothing but a call that connects.

**Unit tests are mandatory in every phase**, which has a consequence
worth stating before the phases rather than inside them: see
[§ What unit tests can and cannot cover](#what-unit-tests-can-and-cannot-cover).

---

## The testing rule, stated once

Every phase below carries a **Tests** line, and no phase is done until
it passes. Two rules make that meaningful rather than ceremonial:

1. **Pure logic lives in its own module, not in a component or a route
   handler.** This is already house practice — the audio strand put its
   text handling in `site/lib/speakable.js` precisely so it could be
   verified when the build itself could not run. Link signing, sync
   message encoding, room-name derivation and expiry arithmetic all
   follow that pattern: a plain module with no I/O, imported by the
   route that uses it.
2. **The coverage threshold applies to those modules, not to the repo.**
   A repo-wide percentage would be met by testing the easy half and
   would say nothing. A 100% line-and-branch threshold on the pure
   modules is both achievable and meaningful, and it fails loudly when
   someone adds logic in the wrong place — which is the actual thing
   worth enforcing.

**Runner: Vitest**, workspace-wide. Recommended over Node's built-in
`node:test` because `lib/` will eventually hold React components and
will need a component testing story; picking one runner now avoids
running two later. This is a recommendation, not a finding — overturn it
if you would rather keep the zero-dependency habit of
`site/scripts/*.mjs`.

---

## Phase 0 — Verify before building

**Deliverable:** answers to four register items, written back into
[`09-sources.md`](09-sources.md). No code.

Four of the fifteen unverified items are cheap and two of them could
change the architecture. This phase is the register being used as the
to-do list it was written to be.

- **Ask Vercel whether the class app counts as commercial use**, and
  whether that pulls the articles site onto Pro. Register item 1. Free,
  and the answer is worth $240/year.
- **Confirm a `vercel.json` rewrite can target another project's
  production URL, and that `basePath` composes with it.** Register item
  2. The entire same-domain arrangement rests on this, and it is
  confirmable from Vercel's routing docs in minutes.
- **Read Daily's REST reference on room expiry** — specifically whether
  a room created but never joined is billable. Register item 6.
- **Confirm npm workspaces installs against per-project Root
  Directories**, including which `installCommand` each Vercel project
  needs. Register item 4.

**Tests:** none, and that is correct — there is no code. Recording the
answers *is* the deliverable.

**Done when:** all four items move out of the register, or are marked
answered with what was learned.

**Stop if:** Vercel says the deployment is commercial *and* Pro is
unacceptable. That is a hosting decision, not a video decision, and it
should be settled before any of the rest is built.

## Phase 1 — The workspace and the harness, shipping nothing

**Deliverable:** npm workspaces at the repo root — `site/`, `class/`,
`lib/` — with `class/` and `lib/` empty placeholders, Vitest configured,
and the push gate extended. The live site is byte-identical to before.

Isolated deliberately. `scripts/verify.mjs` exists because a lockfile
drifted and only surfaced when Vercel ran `npm ci`; this phase moves
that lockfile to the repo root, which makes the same failure *more*
available, not less. If the site's deploy breaks during this phase there
is exactly one suspect.

Work:

- Root `package.json` with `workspaces: ["site", "class", "lib"]`; one
  root `package-lock.json`.
- `site/vercel.json` install command corrected for a root-level install;
  same for the class project when it exists.
- **Push gate: one root `npm ci` always, then build only what changed.**
  Per-package builds keep it fast; the unconditional root install keeps
  the hole `verify.mjs` was written to close from reopening through a
  new door.
- Vitest at the root, projects per workspace, coverage thresholds
  configured but with no modules under them yet.

**Tests:** the harness itself. One trivial passing test per workspace
proves the runner resolves, the coverage reporter runs, and `npm test`
is wired into the gate. `site/`'s existing behaviour is covered by the
production build in `verify.mjs`, which is unchanged.

**Done when:** `npm run verify` passes from a clean clone, Vercel
deploys the site unchanged from the new structure, and the deployed
site is identical to the previous deploy.

**Stop if:** the site's Vercel build cannot be made to work from a root
install. Fall back to `class/` as a standalone package with its own
lockfile, and revisit `lib/` later — the plan below survives that with
Phase 5's extraction step removed.

## Phase 2 — An empty class app at `/class`

**Deliverable:** a Next.js app in `class/`, `basePath: "/class"`,
deployed as its own Vercel project, reachable at `/class` on the live
domain via the `site/vercel.json` rewrite. It renders one page that says
nothing interesting.

This phase exists to prove register item 2 in production rather than on
paper, and it is the cheapest possible way to do that. Everything after
it assumes the routing works; finding out here costs an afternoon,
finding out in Phase 3 costs a debugging session tangled with WebRTC.

Also lands here: `noindex` across the whole app, and Next/React versions
pinned to match `site/`.

**Tests:** little to unit test — this phase is configuration. The
verification is a deployed URL, and the honest note is that
configuration is checked by deploying, not by asserting.

**Done when:** `https://<domain>/class` serves the class app's page,
`/articles/...` still serves the static site with no proxy hop, and
`/class` returns `noindex`.

**Stop if:** the rewrite cannot reach another project's deployment. Fall
back to a subdomain, which costs nothing architecturally and only
changes URLs.

## Phase 3 — A call connects

**Deliverable:** a signed link opens `/class/<token>`, a Daily room is
created lazily, and two people see and hear each other. **Nothing else** —
no article, no sync, no chat, no screen share.

This is the milestone the links-first decision exists to reach. It
answers "does realtime work, for my students, on their networks" before
anything is built on top of that assumption.

Work:

- `lib`-style pure module for **link signing and verification**: encode
  and decode a payload of article slug, room name and expiry; HMAC sign;
  verify signature and expiry in constant time.
- Pure module for **room-name derivation** and **expiry arithmetic**
  from the link payload.
- Daily room creation on first join, with the expiry property set to
  class end — the mitigation [`03`](03-provider-options-and-costs.md) §6
  asked for.
- Admin page behind a shared secret: `noindex`, rate limited, unguessable
  path, timing-safe secret comparison, no session issued.

**Tests — this is the phase where the mandate earns its keep**, because
the link module is the security boundary:

- Round-trip: sign then verify returns the original payload.
- A tampered payload fails verification.
- A tampered signature fails verification.
- An expired link fails, at the boundary second and past it.
- A link for one room does not verify for another.
- Malformed, empty and oversized inputs fail closed rather than throwing.
- Secret comparison is timing-safe (assert the function used, since
  timing itself is not unit-testable).
- Room-name derivation is deterministic for the same payload and
  distinct for different ones.
- Expiry arithmetic across a class that crosses midnight and a DST
  boundary.

**Done when:** all of the above pass at 100% branch coverage, and a real
1:1 call runs end to end with a student on their own network — not on
yours.

**Stop if:** calls fail for a student in a way TURN cannot fix. That
re-opens [`02`](02-p2p-vs-sfu.md), and it is far cheaper to learn now.

## Phase 4 — The article in the call

**Deliverable:** `site` publishes `/articles/<slug>.json` from a
`force-static` route; the class app fetches it and renders the article
alongside the call. Static — no sync yet.

This proves the content seam ([`07`](07-two-app-architecture.md) §3,
register item 10). Styling is **duplicated deliberately** at this stage
rather than extracted, per the decision to create `lib/` only once a
second consumer exists. Note what gets duplicated as you go; that list
is Phase 5's input.

**Tests:**

- The article JSON serialiser: section splitting produces the expected
  named sections; the `"Grammar Spotlight: Reported Speech"` →
  `grammar-spotlight` derivation is asserted directly, since
  [`06`](06-shared-article-view.md) rests on it.
- An article missing an expected section degrades rather than throws.
- The class app's fetch-and-parse layer: a well-formed response renders;
  a 404, a malformed body and a timeout each fail visibly rather than
  silently.
- A slug that does not exist produces a class page that says so.

**Done when:** a class link opens with the correct article beside the
video, and adding a new article to `site/content/` makes it available to
the class app after a site deploy with no class-app redeploy.

**Stop if:** the `force-static` route cannot enumerate articles the way
`dictionary/[shard]/route.js` enumerates shards. Fall back to a
build-time generated JSON file in `public/`.

## Phase 5 — Teaching the class

**Deliverable:** the shared article view per [`06`](06-shared-article-view.md) —
teacher-led section sync with student detach — plus screen sharing and
ephemeral chat. `lib/` is extracted here.

Extraction happens now rather than earlier because this is the first
moment there are genuinely two consumers and you can see what is shared.
CSS tokens and the dictionary popover are the expected contents; the
duplication list from Phase 4 decides the rest.

**Tests:**

- The sync message codec: encode/decode round-trip for every message
  type in [`06`](06-shared-article-view.md) §2.
- **Absolute-state semantics**: applying messages out of order converges
  to the same view state as applying them in order, and a dropped
  message is corrected by the next one. This is the design property the
  whole channel rests on, so it should be encoded as a test rather than
  left as an intention.
- An unknown message type is ignored, not fatal — forward compatibility.
- The follow/detach reducer: detaching stops applying `section`
  messages; re-following jumps to the current section.
- Chat messages are not persisted anywhere — assert the absence.

**Done when:** a full 30-minute class runs on it, and the section
stepper follows `docs/class-structure.md`'s budget.

**Stop if:** nothing here is architecturally risky. If it stalls, it
stalls on design, and the call from Phase 3 still works without it.

## Phase 6 — Accounts

**Deliverable:** student login replacing signed links, per
[`05`](05-accounts-and-access.md).

Deliberately last, and only after answering what accounts will carry a
year out. Nothing before it is thrown away: the token path is identical,
with a session check replacing a signature check, so the Phase 3 module
keeps its tests and gains a caller.

Re-check register item 12 (the Supabase inactivity pause) before
choosing a provider — a paused project fails exactly when a student
tries to join.

**Tests:** session validation, expiry and revocation, at the same
threshold as Phase 3's link module. The GDPR obligations in
[`05`](05-accounts-and-access.md) §5 become live in this phase, and
deletion is a code path, so it gets a test.

---

## What unit tests can and cannot cover

The mandate is worth taking literally, and taking it literally means
being precise about its reach. Unit tests cover the modules listed
above — link signing, codecs, reducers, arithmetic, serialisation — and
those are, deliberately, where every rule this feature depends on lives.

They do **not** cover: whether a `vercel.json` rewrite reaches another
project (Phase 2 verifies by deploying), whether Daily connects across a
student's NAT (Phase 3 verifies with a real student), whether media
plays in a browser, or whether the workspace installs correctly on
Vercel (Phase 1 verifies by deploying). Asserting those with mocks would
produce green tests that prove only that the mock behaves as written.

So the plan pairs each phase's tests with a **stated non-test
verification** — a deploy, a real call, a real student — rather than
implying coverage it does not have. The way to widen genuine coverage
later is end-to-end browser tests against a deployed preview, which is
worth adding once the call is stable and is out of scope here.

## Sequencing rationale

- **Phase 0 before code** because two register items could invalidate
  the architecture and both are answerable in a morning.
- **Phase 1 isolated** because it touches the exact machinery that has
  broken production once, and bundling it would give a broken deploy
  three suspects instead of one.
- **Phase 2 before Phase 3** because the routing arrangement is the
  least-verified structural claim in the strand, and proving it while
  the app is empty separates two hard problems.
- **Phase 3 as the realtime milestone** because the entire links-first
  decision exists to reach it early. A call that connects, with nothing
  around it, is the smallest thing that answers the question the feature
  was uncertain about.
- **`lib/` in Phase 5** because extracting an abstraction against one
  caller designs the wrong abstraction. Phase 4 duplicates on purpose
  and writes down what it duplicated.
- **Accounts last** because they are the most expensive decision that
  buys the least today ([`05`](05-accounts-and-access.md) §4), and
  nothing before them has to be rewritten when they arrive.

## What is deliberately not in this plan

Recording, mobile support, group calls, scheduling, class history,
assigned articles, saved vocabulary, and anything persisted at all
before Phase 6. Each was excluded by a decision recorded in the
[README](README.md), and each would change the GDPR surface in
[`05`](05-accounts-and-access.md) §5.

Also absent: time estimates. The phases are ordered by dependency and
risk, and the only one with a hard external dependency is Phase 0,
which waits on a reply from Vercel.
