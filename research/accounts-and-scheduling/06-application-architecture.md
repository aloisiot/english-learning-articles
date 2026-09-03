# 06 — How the class app is organised

> **The question:** As accounts, scheduling and a session record arrive,
> how should `class/` be laid out?

**Short answer:** **vertical feature slices** — each feature owning its
domain, its adapters and its UI — with Next.js routes kept as thin entry
points. This is a change of shape rather than of principle: the app is
already hexagonal by layer, and this reorganises the same pieces by
feature instead.

---

## 1. What is already true

The app did not arrive at this from nowhere. It is already hexagonal,
structurally rather than aspirationally:

| Layer | Today | Role |
|---|---|---|
| `class/lib/` | nine pure modules, 100% coverage enforced | Domain |
| `class/server/` | `config.ts` (environment), `daily.ts` — *"the only place in the app that talks to Daily over the network"* | Adapters |
| `class/app/` | route handlers and React | Delivery |

`lib/daily-request.ts` even separates the *decisions* — which room
properties are set, what counts as success, pure and tested — from the
*I/O* in `server/daily.ts`, which holds nothing but the `fetch`. That is
a port and an adapter under different names.

**So the decision is not whether to adopt hexagonal.** It is how to cut
the same code: by layer, as now, or by feature.

## 2. The layout

Next.js decides part of this: routing requires `app/`, so pages and route
handlers must live there. They become **thin entry points** — parse the
request, call one function, render — with everything else in the feature.

```
class/
  app/                      routing only; thin
    j/[token]/page.tsx      → imports from features/call
    api/join/route.ts       → imports from features/call
    dashboard/page.tsx      → imports from features/scheduling

  features/
    call/                   the video call
      domain/               pure, tested: chat, initials, video-fit,
                            screen-share, daily-request
      adapters/             daily.ts — the only place that fetches Daily
      ui/                   call-client.tsx and its parts

    access/                 who may do what
      domain/               link, secret, rate-limit
      adapters/             supabase/ — the only place the SDK is imported
      ui/                   the role gate, sign-in

    scheduling/             slots, bookings
      domain/               slot rules, booking eligibility, hold rules
      adapters/
      ui/

  server/                   genuinely cross-cutting only
    config.ts               the environment
    ports.ts                what the domain needs, in domain language
```

`server/` keeps only what no single feature owns. The temptation to make
it a junk drawer is the main way this layout decays.

## 3. What moves, and where

The nine existing modules map onto two features, which is itself evidence
the cut is natural:

| Module | Feature |
|---|---|
| `chat`, `initials`, `video-fit`, `screen-share`, `daily-request` | `call/domain` |
| `server/daily.ts` | `call/adapters` |
| `link`, `secret`, `rate-limit` | `access/domain` |
| `room` | `scheduling/domain` — it derives room names and class windows, which is scheduling, not calling |
| `server/config.ts` | stays in `server/` |

`room.ts` is the interesting one. It sits with the call today because the
call is all there is; it is really about *when a class happens*, which is
the new feature's subject.

## 4. Two consequences that are easy to miss

**The coverage threshold is configured by path.** `vitest.config.mjs`
points its 100% requirement at `class/lib/**` and `lib/**`. Move the pure
modules and the threshold silently stops covering them — the suite still
passes, guarding nothing. The include globs must change in the same
commit as the move, to `class/features/*/domain/**`.

This is exactly the class of failure the repo has already been bitten by:
a check that keeps passing after it stopped checking.

**Tests move with their subject.** `class/test/` is currently flat and
mirrors `class/lib/`. Under slices, a test belongs beside the module it
tests, which is the point of the layout — a feature is a thing you can
read, change and delete in one place.

## 5. Multi-step operations, and the testing rule

Booking is the first operation in this system with real steps: check the
slot is open, hold it, create a pending booking, notify. That does not
belong in a route handler, and it is not pure enough for `domain/`.

The obvious answer is a use-case layer, and it carries a trap.
[`08`](../video-calls/08-implementation-plan.md) states the testing rule
as *"mocking either would prove only that the mock behaves as written"* —
and a use-case orchestrating ports is precisely where people reach for
mocks.

**The resolution is the one `daily-request.ts` already demonstrates: keep
the orchestration dumb and push every decision into pure functions.** If
`bookSlot()` has no branches, there is nothing worth mocking, because
every judgement it might have made lives in `domain/` where it is tested
for real. A use-case that needs a mock to be worth testing is a use-case
holding logic that should have been extracted.

## 6. When to do it

**Now, and in its own commit**, before accounts add code to the old
shape. Nine modules and 246 tests are the cheapest this will ever be, and
the tests are the safety net that makes the move mechanical rather than
risky.

The one honest argument against: Phase 4's gate is still open — no two
people have run a real class — so this churns code that is about to be
exercised for the first time. That argues for doing it as a **pure
move**, with no behavioural change in the same commit, so that anything
which breaks afterwards is attributable.
