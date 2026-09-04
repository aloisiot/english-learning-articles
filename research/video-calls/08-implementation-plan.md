# 08 — A phased plan

> **Reorganised 2026-08-30** against `SESSION-2026-08-30.md` and the
> repository as it now stands. Phases 1–3 are built. **Neither of their
> acceptance gates has been closed**, so the old numbering no longer
> describes anything real and the remaining phases are renumbered from
> Phase 4. The original six-phase reasoning is preserved in
> [§ Sequencing rationale](#sequencing-rationale-revised); what changed
> is recorded rather than overwritten.

> **Updated 2026-09-02.** Both projects are deployed, `/class` serves the
> class app on the site's domain, the admin page works in production, and
> a call connects. Phase 2's gate is closed.

> **Phase 4's gate closed 2026-09-03.** A real class was run with a second
> person on their own network, and nothing failed. Chat carried messages
> between two browsers, the unread badge counted messages the reader did
> not send, the screen-share picker opened, and a vertical phone camera
> went through the tile-shape rule. All four had been verified
> structurally and none had been seen working; they now have.
>
> This is recorded rather than assumed because the whole point of the
> gate was that the code could not supply this half. Everything built
> afterwards stands on a call that is known to work between two people,
> which is what the gate existed to establish.
>
> Two decisions changed with it. **`/class` is routed by a Vercel
> microfrontends group, not by a rewrite** — the rewrite never worked and
> is gone. And **accounts, auth and scheduling move from last to next**,
> which reverses this plan's most deliberate sequencing call; the reason
> is recorded in [§ Sequencing rationale](#sequencing-rationale-revised)
> rather than quietly applied.

> **The question:** Given docs 01–07, what is the smallest first thing
> worth building, in what order does the rest follow, and how is each
> phase known to be finished?

**Short answer, restated for where the work actually is:** the code for
Phases 1–3 exists and is well tested, it is deployed, `/class` serves it
on the real domain, and a call connects. What has *not* happened is a
class — two people, two networks, thirty minutes, a room that expires on
its own afterwards. The routing gate is closed and the call gate is
half-closed, which is a materially better position than a week ago and
still not the same as proven.

The easy half of old Phase 5 (chat, screen sharing, responsive layout)
shipped ahead of both gates, and none of it has been exercised by two
people yet. Those unknowns are still queued in Phase 4.

---

## Where the plan stands

Verified by reading the repository and querying the live deployments on
2026-09-02, not only the session record.

| Original phase | State | Evidence |
|---|---|---|
| **0** Verify before building | **Partly closed** | Register item 4 answered in practice — `installCommand: "cd .. && npm ci"` in both configs, plus *Include files outside the Root Directory*. **Item 2 is now closed**, though not with the answer it asked for (below). Items 1 and 6 still open. |
| **1** Workspace and harness | **Done** | Root `package.json` with `workspaces: ["site","class","lib"]`; Vitest + v8 coverage; `scripts/verify.mjs` running env check → root `npm ci` → tests → per-workspace verify. |
| **2** Empty class app at `/class` | **Done, gate closed** | Both Vercel projects exist and deploy. `https://english-learning-articles.vercel.app/class` returns 200 with `<title>Class</title>` and `noindex, nofollow`; `/class/j/<token>` and `/class/admin/<key>` resolve; `/`, an article page and `/dictionary/<shard>` are unaffected. Routed by `site/microfrontends.json`, not by a rewrite. |
| **3** A call connects | **Built, gate half closed** | Nine modules in `class/lib/`, each with a matching test file, plus `secret-timing` and a harness test. A call **connects** — the admin page mints a link, the link opens, the room is created lazily and the token admits. It has only been done from two browsers on one machine, so nothing about a second person, a second network or a thirty-minute duration is proven. |
| **4** The article in the call | **Not started** | No `force-static` articles JSON route on the site — `dictionary/[shard]/route.js` is still the only one. The class app carries a slug through the token but fetches and renders no article. |
| **5** Teaching the class | **Half done, out of order, and now deprioritised** | Chat, screen sharing and the responsive layout are built and deployed; none has been used by two people. Section sync is not built. `lib/` is still the empty placeholder its own `package.json` describes. Accounts now come first — see the resequencing below. |
| **6** Accounts | Not started, **and promoted to next** | The reasoning that put it last assumed the product was a call. It is a tutoring business, and payment and scheduling need identity. Now Phase 5. |

The line that mattered a week ago was the repetition of *gate not
closed*. One of the two is now closed and the other is half closed, and
the correction holds in a smaller form: the remaining half of Phase 3's
gate is the half the code cannot supply on its own, and it is the half
still outstanding. A call that connects between two tabs on one laptop
proves the token path. It proves nothing about a network.

## What the build changed about the plan's assumptions

Four things the plan did not anticipate, each now load-bearing.

**The class app is TypeScript.** The plan assumed the site's plain-JS
idiom, and `class/` is `.ts`/`.tsx` with a typecheck in the gate. This
has an unnoticed consequence for a later phase: `lib/` will have to
serve a **JavaScript consumer (`site/`) and a TypeScript one
(`class/`)**. That is ordinary but not free, and it should be decided
deliberately in Phase 7 rather than discovered.

**`/class` is routed by a microfrontends group, and the rewrite never
worked.** This is the largest correction on the page, and the route to it
is worth keeping because every step of it looked reasonable.

`site/vercel.json` first became `site/vercel.ts`, computing the rewrite
destination from `CLASS_APP_DOMAIN` so a site preview could point at a
class preview, with the getter *throwing* when the variable was absent —
on the argument that a loud failure beats a silent
`https://undefined/class/:path*`. Vercel validates that config **before
the build starts**, the one computed value in it resolved to nothing, and
the deployment failed schema validation with `rewrites[0] missing
required property destination`. Production rolled back to a commit
predating the rewrite. The lesson is specific: for a config file, "fail
loudly" does not mean a visible error — it means a deploy that never
happens and a silent rollback to whatever shipped last.

With a literal destination the deploy succeeded and `/class` still 404ed.
A header probe added to the same file **did** appear on every response,
which proved the config reached the edge and narrowed the fault to the
`rewrites` array specifically rather than the file being ignored.

The resolution was to stop debugging the mechanism and change it.
`site/microfrontends.json` declares the site as the default application
and routes `/class/:path*` to the class project; Vercel's routing layer
does the rest. It worked immediately.

**So register item 2 is closed, with the opposite of the expected
answer.** The question was whether a rewrite can reach another project's
production URL. Here it cannot, and the product built for the problem
can. Two consequences worth carrying: there is no hostname to configure,
so the `CLASS_APP_DOMAIN` idea is not merely unused but unnecessary; and
**microfrontends is available on the Hobby plan** — confirmed against the
live team, which had been an open worry.

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
This changes Phase 6 below.

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

## Phase 4 — Close the call gate

**Deliverable:** a real 30-minute class, two people on two networks, and
a room that expires afterwards without intervention.

**The deployment half of this phase is done.** Both projects build from
the same repo with Root Directory `site/` and `class/` and *Include files
outside the Root Directory*. `/class` serves the class app on the site's
domain, `/class/admin/<key>` renders the link generator in production,
and the six variables are set on the class project. Deployment Protection
turned out not to obstruct anything, so the worry recorded against it is
discharged rather than pending.

**Closed 2026-09-03.** A real class ran with a second person on their own
network and surfaced no defects. The four features listed below as
never-exercised were exercised, and worked.

What follows is the work as it was written before the run, kept because
it records what was actually unknown rather than being rewritten to look
as though it always held. The one item still genuinely open is room
expiry without intervention, which nobody watched for.

Work:

- **Run a real class.** A student on their own connection, a full
  thirty minutes, and then confirm the room is gone without anyone
  closing it.
- **Exercise what was built past the gate, while a second person is
  there.** Chat has never carried a message between two browsers; the
  unread badge has never counted a message the reader did not send; the
  screen-share picker has never opened on a room that permits it; and no
  vertical phone camera has been through the tile-shape rule. Each was
  verified structurally, which was worth doing and is not the same thing.
- **A room predating the `enable_screenshare` fix will still refuse to
  share.** Rooms are created from the link and never updated, so test
  with a link generated after that change rather than concluding the
  feature is broken.
- **Answer register item 6 while here:** whether a Daily room created but
  never joined is billable.

Environment variables are set for **Production only**, deliberately. The
class app's getters throw on anything missing, so every preview
deployment will 500 on every route — expected, not a defect, and left
that way until there is a production-ready app worth previewing against.
When previews are wired, `CLASS_LINK_SECRET` and `CLASS_ADMIN_SECRET`
must differ from production: rotating the link secret is the only
revocation mechanism there is, so a shared one makes every test link
valid against production.

**Tests:** nothing new is unit-testable — this phase is a live call.
Saying so is the point: the verification is a call that connects between
two people, and mocking it would prove only that the mock behaves as
written.

**Done when:** a real 30-minute class runs with a student on their own
network, chat and screen sharing are seen working between two people, and
the room expires afterwards without intervention.

**Stop if:** the call fails in a way that is not a configuration
problem — media that will not traverse a real network is a provider
question, and [`03`](03-provider-options-and-costs.md) is where it goes.

## Phase 5 — Accounts, scheduling, and the session record

**Deliverable:** tutors and students have accounts, a class can be
scheduled rather than hand-minted from an admin page, and every session
that happens leaves a durable record of who taught, who attended, and
when.

**This was Phase 7, and moving it is a reversal of this plan's most
deliberate sequencing call.** The reason is recorded in
[§ Sequencing rationale](#sequencing-rationale-revised): the old ordering
assumed the product was a call, and it is a tutoring business. Payment —
of the tutor, by the student — cannot be reconstructed from a room that
has already expired, and scheduling and payment both need identity first.

Three things this phase decides, and they are worth deciding before code:

- **The stateless design ends here, and that is the real cost.** Phase 1
  worked without a database because nothing had to be remembered: the
  signed link *is* the authorisation, and the room is derived rather than
  stored. A session record is a database. `class/lib/link.ts` keeps its
  tests and gains a caller — a session check where a signature check
  is — so nothing is thrown away, but the GDPR surface in
  [`05`](05-accounts-and-access.md) §5 opens for real, over attendance
  records for people who may be minors.
- **The session record is a financial record, not a log.** Analysis,
  tutor payment and student payment were named together but do not want
  the same thing. The billable fact — who taught, who attended, start,
  end, duration — should be written once at session end and be
  append-only; analytics is then a read over it rather than a second
  log. This is the part that cannot be added retroactively.
- **Payment is recorded, not built.** The decision is to capture what a
  payment system will need and to implement none of it, so that adding
  one later is not a migration.

**Open before starting.** Two answers change the design materially and
neither is in the repository: whether students self-register or a tutor
invites them — self-registration is a much larger auth and consent
surface — and whether scheduling has to cross timezones.
`class/lib/room.ts` is scrupulously UTC-only, which sets this up well,
but a booking UI is where timezone bugs actually live.

Re-check register item 12 (the Supabase inactivity pause) before choosing
a provider. Chat history becomes possible here for the first time, which
is the natural moment to revisit open item 7 below.

## Phase 6 — The article in the call

**Deliverable:** `site` publishes `/articles/<slug>.json` from a
`force-static` route; the class app fetches it and renders the article
beside the call. Static — no sync yet.

This proves the content seam ([`07`](07-two-app-architecture.md) §3,
register item 10) and is the last structural unknown in the architecture.

Amended for the optional-article decision, and now sitting after accounts: the token may carry **no**
slug, so the class page has two shapes — with an article and without —
and the second is not an error state. The link module already enforces
that a *present* slug is non-empty; the renderer has to treat absence as
ordinary.

Styling is **duplicated deliberately** here rather than extracted, per
the decision to create `lib/` only once a second consumer exists. Note
what gets duplicated; that list is Phase 7's input.

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

## Phase 7 — Section sync, and `lib/`

**Deliverable:** teacher-led section sync with student detach, per
[`06`](06-shared-article-view.md). Chat and screen sharing are already
done, so this phase is the sync and the extraction.

`lib/` is populated here, with a clearer input than the plan originally
had: what Phase 6 duplicated, plus the CSS tokens and the dictionary
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

---

## Open items from 2026-08-30, triaged

**Closed since:** the two Vercel projects exist and deploy (1);
Deployment Protection never obstructed anything (3); `npm audit` reports
zero vulnerabilities, the three high-severity ones having come from
`@vercel/config`, which went with the rewrite (from `.next-steps.md`).

**Still into Phase 4:** the Hobby commercial-use question, still open and
still blocking *launch* rather than building (2) — note that
microfrontends itself turned out to be available on Hobby, which was a
separate worry and is now discharged; the screen-share error strings,
which are observed behaviour rather than documented and fail towards
being visible (8).

**Housekeeping, do now, unrelated to any phase:** `site/lib/dictionary-data/*.json`
is stale and `npm run verify` regenerates it (5); `.DS_Store` is tracked
(6); `.claude/launch.json` — keep or drop (11).

**Accepted, not defects:** chat has no history, which is what "no
database" means and is correct until Phase 5 (7); the commit granularity
note, which records a real constraint rather than a task (10).

**Deferred with a reason:** the pre-commit hook is bypassable via
`--no-verify` and merge commits (9) — the genuinely unbypassable version
is a server-side push rule or a CI check, which is worth adding once CI
exists and is not worth building CI for alone.

**Moot:** Vercel's `relatedProjects` (4) was to remove a manual
`CLASS_APP_DOMAIN` for previews. There is no rewrite and no such
variable; the microfrontends group already knows where the other
project's deployments are. Preview environments are deliberately unwired
until there is a production-ready app — see Phase 4.

**Dropped:** "solve the inconsistency fail" from `.next-steps.md`.
Nothing in the repository names it and its author no longer recalls what
it meant.

**A note on `.next-steps.md`.** It is a priority list being reevaluated,
not a scope list. A phase in this plan that does not appear there is
unscheduled, not cancelled — the two documents answer different
questions and should not be read as competing.

## Sequencing rationale, revised

The original reasoning held and mostly still does:

- **Phase 1 isolated** because it touched the machinery that had broken
  production once. It worked — the workspace conversion landed cleanly.
- **Deployment before the article seam** because routing was the least
  verified structural claim in the strand. It was also the one that took
  four failed deploys to settle, which vindicates the ordering: had it sat
  behind two more phases of feature work, the same debugging would have
  happened with more code resting on it.
- **`lib/` late** because extracting an abstraction against one caller
  designs the wrong abstraction. The article phase duplicates on purpose.
- **Accounts last** because they were the most expensive decision that
  bought the least today ([`05`](05-accounts-and-access.md) §4).
  **Reversed on 2026-09-02 — see below.**

**Why accounts moved from last to next.** The original reasoning was
sound about cost and wrong about the product. It weighed accounts as a
feature of a video call, where they buy little: the signed link already
admits the right two people, and a session check would replace a
signature check without changing anything a student sees. But the product
is a tutoring business. Tutors are paid for sessions, students pay for
sessions, and neither number can be reconstructed from a Daily room that
expired ten minutes after the class. Section sync makes a class better;
accounts and a session record make it *sellable*, and one of those is
load-bearing for the thing existing at all.

The cost the original ordering identified has not gone away — it has been
accepted. Accounts end the stateless design, open the GDPR surface in
[`05`](05-accounts-and-access.md) §5, and introduce the first database.
That is why the new Phase 5 leads with three decisions rather than a task
list: the expensive part is choosing what to persist, not persisting it.

What is *not* a reason: nothing about the call is finished. Phase 4's
gate is still open, and building accounts on a call flow that two people
have never used would repeat exactly the mistake this plan already
records — writing code past a gate and paying for it later, with
interest, in whichever phase finally has to close it. **Phase 4 stays
first.**

What the earlier session revised: **the gates were the plan, not the
phases.**
Each phase's "Done when" was written to be the phase, and building three
phases' worth of code without closing two of the gates left the plan
describing an order the work did not follow. The correction is not to
loosen the gates but to notice that skipping one does not remove it — it
moves it, with interest, into the phase that finally has to close it.
Phase 4 is that phase, and it is still carrying the unknowns — chat, the
unread badge, screen sharing and camera shapes between two real people —
that would each have been cheaper alone.

## What is deliberately not in this plan

Recording, group calls, assigned articles and saved vocabulary. Each was
excluded by a decision recorded in the [README](README.md), and each
would change the GDPR surface in [`05`](05-accounts-and-access.md) §5.

**Scheduling and class history are no longer on this list.** They moved
into Phase 5 with accounts, because a tutoring business needs them and
because the session record they imply is the one thing that cannot be
backfilled. Their GDPR consequences are not waived by being wanted, and
[`05`](05-accounts-and-access.md) §5 is now Phase 5 reading rather than
Phase 7 reading.

**Payment processing remains excluded.** The decision is to record what a
payment system would need and to build none of it.

Mobile support remains out of scope as a *target*, though the responsive
work done in this session means the call no longer breaks on a phone.
That is a bonus, not a commitment: `getDisplayMedia` is absent on mobile
browsers, so screen sharing is desktop-only by capability, and nothing
about a phone class has been tested.

Also absent: time estimates. Phases are ordered by dependency and risk.
The only hard external dependency is still Vercel's reply on commercial
use.
