# 08 — A phased plan

> **Reorganised 2026-08-30** against `SESSION-2026-08-30.md` and the
> repository as it now stands. Phases 1–3 are built. **Neither of their
> acceptance gates has been closed**, so the old numbering no longer
> describes anything real and the remaining phases are renumbered from
> Phase 4. The original six-phase reasoning is preserved in
> [§ Sequencing rationale](#sequencing-rationale-revised); what changed
> is recorded rather than overwritten.

> **The question:** Given docs 01–07, what is the smallest first thing
> worth building, in what order does the rest follow, and how is each
> phase known to be finished?

**Short answer, restated for where the work actually is:** the code for
Phases 1–3 exists and is well tested, but **nothing is deployed and no
real call has ever run**. Those two unmet gates have *merged* — a
student cannot join a localhost, so proving the routing and proving a
call are now one phase, not two. Meanwhile the easy half of old Phase 5
(chat, screen sharing, responsive layout) shipped ahead of both gates,
which moves several unknowns into the first live call.

---

## Where the plan stands

Verified by reading the repository on 2026-08-30, not only the session
record.

| Original phase | State | Evidence |
|---|---|---|
| **0** Verify before building | **Partly closed** | Register item 4 answered in practice — `installCommand: "cd .. && npm ci"` in both configs, plus *Include files outside the Root Directory*. Items 1, 2 and 6 still open. |
| **1** Workspace and harness | **Done** | Root `package.json` with `workspaces: ["site","class","lib"]`; Vitest + v8 coverage; `scripts/verify.mjs` running env check → root `npm ci` → tests → per-workspace verify. |
| **2** Empty class app at `/class` | **Built, gate not closed** | `site/vercel.ts` and `class/vercel.json` exist and are coherent. **The Vercel account has zero projects.** Nothing is deployed; the rewrite has never served a request. |
| **3** A call connects | **Built, gate not closed** | Nine modules in `class/lib/`, each with a matching test file, plus `secret-timing` and a harness test. **No two-person call has been run.** |
| **4** The article in the call | **Not started** | No `force-static` articles JSON route on the site — `dictionary/[shard]/route.js` is still the only one. The class app carries a slug through the token but fetches and renders no article. |
| **5** Teaching the class | **Half done, out of order** | Chat, screen sharing and the responsive layout are built. Section sync is not. `lib/` is still the empty placeholder its own `package.json` describes as "populated starting Phase 5". |
| **6** Accounts | Not started | Correct — it was always last. |

The line that matters is the repetition of *gate not closed*. Both
phases were designed around a verification the code cannot supply on its
own, and in both cases the code was written and the verification skipped.

## What the build changed about the plan's assumptions

Four things the plan did not anticipate, each now load-bearing.

**The class app is TypeScript.** The plan assumed the site's plain-JS
idiom, and `class/` is `.ts`/`.tsx` with a typecheck in the gate. This
has an unnoticed consequence for a later phase: `lib/` will have to
serve a **JavaScript consumer (`site/`) and a TypeScript one
(`class/`)**. That is ordinary but not free, and it should be decided
deliberately in Phase 6 rather than discovered.

**`site/vercel.json` became `site/vercel.ts`.** The rewrite destination
now comes from `CLASS_APP_DOMAIN` so a site preview can point at a class
preview, with `classAppDomain()` throwing rather than defaulting —
because `https://undefined/class/:path*` is a valid config that fails at
the edge, which is a broken deploy that looks like a successful one.
The reasoning is sound and the failure mode it prevents is real.

But it makes register item 2 **larger, not smaller**. There are now two
unproven things stacked: that Vercel evaluates a TypeScript config at
build time as expected, and that a rewrite reaches another project's
deployment. One deploy has to prove both, and if it fails, the two
causes are entangled. Worth knowing before debugging starts.

**An env-safety subsystem exists that the plan never asked for.** A
pre-commit hook and `scripts/check-env-files.mjs`, versioned under
`.githooks/` and wired by the root `prepare` script, enforcing that no
env file but a template is committed and that a committed template
declares no values. It exists because real secrets — including a Daily
API key — were typed into the tracked `class/.env.example` and came
within one `git add -A` of being committed.

This was the right response and it is now part of the gate. Recorded
here as completed work rather than left in a session file, because the
plan is what someone reads to know what the pipeline does.

**A class no longer needs an article.** Not in the original plan, which
assumed every class was about one. The slug is now omitted from the
token payload rather than emptied, so "no article" has one spelling.
This changes Phase 5 below.

## The testing rule, restated

Unchanged in force, and being honoured: nine pure modules in
`class/lib/`, nine test files, logic kept out of components and route
handlers exactly as the rule requires. The session reports 238 tests
passing with typecheck and a production build of both apps.

**That figure is quoted, not re-measured.** The suite could not be run
while writing this: `node_modules` holds macOS binaries and reinstalling
for another platform would break the working local install. This is the
same discipline the audio strand applied to a script that would not run
— the number is reported, and where it came from is stated.

A **third rule** is added, from bug 1 of the session:

3. **A golden value is pinned to an externally-derived expectation, never
   regenerated from the code under test.** `deriveRoomName` separated
   slug from start time with a literal NUL byte; the byte was invisible
   when read, mistaken for a space, and the check that should have caught
   the change had its expected value taken from the *changed* code — so
   it agreed with the error. A test that asserts the code does what the
   code does is not a test. Changing a golden value is a decision that
   needs a reason, not a fix.

   The secondary lesson is narrower and worth keeping: the byte was
   written literally, so git reported `Bin 4715 -> 5690 bytes` instead of
   a diff. **Control characters go in source as escapes** — identical at
   runtime, reviewable in a diff.

## Phase 4 — Deploy, and close both skipped gates

**Deliverable:** two Vercel projects, `/class` live on the real domain,
and a 1:1 class run end to end with a real student on their own network.

These were Phase 2's and Phase 3's separate acceptance criteria. They
merge here because they can no longer be closed independently — a
student cannot join a call on your laptop. Within the phase the original
order still holds: deploy first, confirm `/class` serves, *then* call.

Work:

- **Create both projects** from the same repo — Root Directory `site/`
  and `class/`, both with *Include files outside the Root Directory* so
  `cd .. && npm ci` reaches the root lockfile.
- **`CLASS_APP_DOMAIN` on the site project**, for every environment that
  serves `/class`. The build now fails without it, which is the intended
  behaviour.
- **The six `class/.env.example` variables on the class project**, with
  **fresh values for the three `CLASS_*` secrets**. Rotating
  `CLASS_LINK_SECRET` is the only link-revocation mechanism there is, so
  production must not share it with anything used in testing.
  `CLASS_ADMIN_PATH` needs to be long and unguessable; the `cap` that
  appeared during testing is not.
- **Check Deployment Protection on the class project.** If it covers the
  production deployment, the site's rewrite proxies into an auth wall and
  `/class` breaks in a way that looks like a routing bug. Check it before
  concluding anything about the rewrite.
- **Answer register item 6 while here:** whether a Daily room created but
  never joined is billable.

**Tests:** nothing new is unit-testable — this phase is deployment and a
live call. Saying so is the point: the verification is a URL that serves
and a call that connects, and mocking either would prove only that the
mock behaves as written.

**Done when:** `https://<domain>/class` serves the class app;
`/articles/...` still serves the static site with no proxy hop; a real
30-minute class runs with a student on their own network; the room
expires afterwards without intervention.

**Stop if:** the rewrite cannot reach the class project, or Deployment
Protection cannot be relaxed for it. Fall back to a subdomain — it costs
nothing architecturally and only changes URLs.

**What this phase inherits from the ordering.** Chat, screen sharing,
unread counting and the responsive layout were built ahead of it, and
were verified structurally — against the real stylesheet, driven by the
ratios `onResize` would supply, at measured viewports — but never against
live streams. So the chat round trip, unread counting, screen sharing
end to end, and whether Daily reports the expected aspect ratio for a
rotated phone camera are all **first-live-call discoveries in this
phase** rather than settled ones. That is the cost of building past a
gate, and it is worth paying attention to precisely because the work
itself was good.

## Phase 5 — The article in the call

**Deliverable:** `site` publishes `/articles/<slug>.json` from a
`force-static` route; the class app fetches it and renders the article
beside the call. Static — no sync yet.

This proves the content seam ([`07`](07-two-app-architecture.md) §3,
register item 10) and is the last structural unknown in the architecture.

Amended for the optional-article decision: the token may carry **no**
slug, so the class page has two shapes — with an article and without —
and the second is not an error state. The link module already enforces
that a *present* slug is non-empty; the renderer has to treat absence as
ordinary.

Styling is **duplicated deliberately** here rather than extracted, per
the decision to create `lib/` only once a second consumer exists. Note
what gets duplicated; that list is Phase 6's input.

**Tests:**

- The article JSON serialiser: section splitting produces the expected
  named sections, and the `"Grammar Spotlight: Reported Speech"` →
  `grammar-spotlight` derivation asserted directly, since
  [`06`](06-shared-article-view.md) rests on it. Golden values taken from
  the article source, per rule 3.
- An article missing an expected section degrades rather than throws.
- Fetch-and-parse: a well-formed response renders; a 404, a malformed
  body and a timeout each fail visibly rather than silently.
- A token with no slug renders a call with no article, and no request is
  made.

**Done when:** a class link opens with the correct article beside the
video, a link without a slug opens a call with no article, and adding an
article to `site/content/` makes it available to the class app after a
site deploy with no class-app redeploy.

**Stop if:** the `force-static` route cannot enumerate articles the way
`dictionary/[shard]/route.js` enumerates shards. Fall back to a
build-time generated JSON file in `public/`.

## Phase 6 — Section sync, and `lib/`

**Deliverable:** teacher-led section sync with student detach, per
[`06`](06-shared-article-view.md). Chat and screen sharing are already
done, so this phase is the sync and the extraction.

`lib/` is populated here, with a clearer input than the plan originally
had: what Phase 5 duplicated, plus the CSS tokens and the dictionary
popover. **Decide the JS/TS boundary explicitly** — `site/` is JavaScript
and `class/` is TypeScript, so the package has to be consumable by both.

**Tests:**

- The sync message codec: encode/decode round-trip for every message
  type in [`06`](06-shared-article-view.md) §2. `class/lib/chat.ts`
  already establishes the pattern — validated on the way in as well as
  out — and the sync codec should match it.
- **Absolute-state semantics:** messages applied out of order converge to
  the same view state as in order, and a dropped message is corrected by
  the next. This is the property the whole channel rests on, so it is a
  test rather than an intention.
- An unknown message type is ignored, not fatal.
- The follow/detach reducer: detaching stops applying `section` messages;
  re-following jumps to the current section.

**Done when:** a full 30-minute class runs on it, and the stepper follows
`docs/class-structure.md`'s budget.

**Stop if:** nothing here is architecturally risky. If it stalls, it
stalls on design, and the call still works without it.

## Phase 7 — Accounts

Unchanged from the original Phase 6. Deliberately last, and only after
answering what accounts will carry a year out. Nothing before it is
thrown away: the token path is identical, with a session check replacing
a signature check, so `class/lib/link.ts` keeps its tests and gains a
caller.

Re-check register item 12 (the Supabase inactivity pause) before choosing
a provider. Chat history becomes possible here for the first time, which
is the natural moment to revisit open item 7 below.

---

## Open items from 2026-08-30, triaged

**Into Phase 4:** create the two Vercel projects (1); the Hobby
commercial-use question, still open and still blocking *launch* rather
than building (2); Deployment Protection on the class project (3); the
screen-share error strings, which are observed behaviour rather than
documented and fail towards being visible (8).

**Housekeeping, do now, unrelated to any phase:** `site/lib/dictionary-data/*.json`
is stale and `npm run verify` regenerates it (5); `.DS_Store` is tracked
(6); `.claude/launch.json` — keep or drop (11).

**Accepted, not defects:** chat has no history, which is what "no
database" means and is correct until Phase 7 (7); the commit granularity
note, which records a real constraint rather than a task (10).

**Deferred with a reason:** the pre-commit hook is bypassable via
`--no-verify` and merge commits (9) — the genuinely unbypassable version
is a server-side push rule or a CI check, which is worth adding once CI
exists and is not worth building CI for alone. Vercel's `relatedProjects`
(4) would remove the manual `CLASS_APP_DOMAIN` for previews; revisit
**after** Phase 4 succeeds, because adopting it is much easier once the
manual version is known to work than while debugging a first deploy.

## Sequencing rationale, revised

The original reasoning held and mostly still does:

- **Phase 1 isolated** because it touched the machinery that had broken
  production once. It worked — the workspace conversion landed cleanly.
- **Deployment before the article seam** because routing is the least
  verified structural claim in the strand, and `vercel.ts` has made it a
  larger claim rather than a smaller one.
- **`lib/` late** because extracting an abstraction against one caller
  designs the wrong abstraction. Phase 5 duplicates on purpose.
- **Accounts last** because they are the most expensive decision that
  buys the least today ([`05`](05-accounts-and-access.md) §4).

What the session revised: **the gates were the plan, not the phases.**
Each phase's "Done when" was written to be the phase, and building three
phases' worth of code without closing two of the gates left the plan
describing an order the work did not follow. The correction is not to
loosen the gates but to notice that skipping one does not remove it — it
moves it, with interest, into the phase that finally has to close it.
Phase 4 is that phase, and it is now carrying four unknowns that would
each have been cheaper alone.

## What is deliberately not in this plan

Recording, group calls, scheduling, class history, assigned articles,
saved vocabulary, and anything persisted before Phase 7. Each was
excluded by a decision recorded in the [README](README.md), and each
would change the GDPR surface in [`05`](05-accounts-and-access.md) §5.

Mobile support remains out of scope as a *target*, though the responsive
work done in this session means the call no longer breaks on a phone.
That is a bonus, not a commitment: `getDisplayMedia` is absent on mobile
browsers, so screen sharing is desktop-only by capability, and nothing
about a phone class has been tested.

Also absent: time estimates. Phases are ordered by dependency and risk.
The only hard external dependency is still Vercel's reply on commercial
use.
