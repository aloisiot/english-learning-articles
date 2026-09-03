# Accounts and scheduling research

**Date:** 2026-09-03
**Question:** What does an account system for this platform have to
support, how does scheduling work on top of it, and how much does
choosing Supabase bind the system to Supabase?

## The reframe this strand starts from

[`video-calls/README`](../video-calls/README.md) recorded *"just me, a
handful of students"*, with the author teaching. **That is inverted.**
The author is a **student**, and the platform's first purpose is to bring
his own tutors across from another platform. Becoming a business is a
possible later outcome, not the starting premise.

The system is therefore **two-sided from day one**, and the author holds
two roles at once.

## Decisions taken

- **Sign-up:** public self-registration.
- **Role:** chosen by the user on a gate screen after sign-up, before any
  other interaction. Tutor or student.
- **Credentials:** magic link first — explicitly temporary. OAuth and
  username + password become the defaults later.
- **Session:** one month, to keep a login out of the way of a class.
- **Roles:** owner (the author), tutor, student. Held as a set, not a
  column.
- **Availability:** concrete slots a tutor opens. No recurrence.
- **Tutor approval:** a tutor's schedule is not published until the owner
  approves them. The role is self-chosen; being bookable is not.
- **Booking approval:** per tutor. Some vet bookings, some do not.
- **Supabase is an adapter**, outside the business rules, behind a port
  written in domain language.
- **Pending bookings hold the slot**, with no automatic expiry.
- **Timezones:** classes cross countries. UTC stored, local displayed.
- **Session outcomes:** completed, student cancelled, student no-show,
  tutor cancelled, technical failure.
- **Money:** not in the model. Recorded facts only.
- **Joining a class:** from the dashboard, logged in.
- **Cancellation windows:** deferred to the billing discussion.
- **Code layout:** vertical feature slices — `call`, `access`,
  `scheduling` — each owning its domain, adapters and UI, with Next.js
  routes as thin entry points.
- **Design system:** the site already has one; the class app's non-call
  screens adopt it. The call surface stays dark and bespoke, on purpose.

## Contents

- [`01`](01-what-this-must-do.md) — who uses this, in what roles, and
  what an account carries
- [`02`](02-platform-dependence.md) — **how tightly Supabase binds the
  system, and what a migration would cost**
- [`03`](03-the-data-model.md) — the five entities, and which one cannot
  be backfilled
- [`04`](04-scheduling-and-booking.md) — slots, approval, holds, and why
  concrete slots dissolve the timezone problem
- [`05`](05-register.md) — what is unverified
- [`06`](06-application-architecture.md) — how `class/` is organised, and
  the coverage config that must move with it
- [`07`](07-design-system.md) — what the site already has, and what
  belongs in `lib/`

## The answer in one page

**Supabase is a defensible choice, and the lock-in is manageable —
because the identity records live in your own Postgres rather than in the
vendor's database.** That is the structural difference from Clerk or
Auth0, and it is what makes every other portability question answerable.
`pg_dump` takes your users with everything else.

The lock-in that matters is not data. It is **authorisation expressed as
Supabase-specific SQL**, and **SDK calls spread through application
code**. Four decisions keep both bounded, and together they cost about
one extra column and one join:

1. The browser never talks to Supabase directly — the class app is
   already a server holding every secret.
2. `profile.id` is ours; `auth_user_id` is the only vendor reference in
   the schema.
3. Authorisation lives in server code, with RLS as defence in depth
   rather than as the whole model.
4. Identity and persistence sit behind **ports written in domain
   language**, with Supabase as an adapter on the far side — the same
   shape `lib/daily-request.ts` and `server/daily.ts` already have.

With those, a migration is: dump the data (trivial), carry the users
(easy — they are rows, and password hashes are portable), rewrite the RLS
policies (moderate), and change one auth module. Without them, the same
migration is a rewrite. **And GoTrue can be self-hosted against the same
Postgres**, which is less a migration than a change of operator. It was
also expected to be the answer to the inactivity-pause risk; that turned
out to have a $25/month answer instead, so self-hosting is back to being
only what it says it is — the exit.

**The design itself is five entities**, of which four are ordinary and
one is urgent. `session` records what actually happened — who taught, who
attended, scheduled against actual times, and which of five outcomes —
and it is the only thing here that cannot be reconstructed after the day
has passed. It is append-only, and it is the reason accounts and the
session record belong in one phase: **only a logged-in join can know who
attended.** Signed links never could.

**Money is deliberately absent** and stays safe to add later, on one
condition: sessions must be written from the very first real class. A gap
in the record is a gap in whatever is eventually invoiced from it.

## What this strand did not establish

Whether identity linking will carry a user from magic link to OAuth
without duplicating them. Whether self-registration is compatible with
the earlier "students are adults" assumption, which nothing now
enforces. Both are in [`05`](05-register.md).

The one check that could have changed the vendor has since been made, on
2026-09-03. It does pause — a week idle, confirmed on Supabase's own
pricing page — and it is worse than the strand assumed, because restoring
is a manual dashboard action and a student's arrival does not trigger it.
It is also not a reason to leave: pausing is a free-tier billing policy,
and Pro at $25/month does not pause. **Supabase stands**, on Pro before
the first real student. [`05`](05-register.md) item 1 has the detail.

It also did not design the screens, the RLS policies, or the migration
order. Those follow once the register's first item is answered.

[`06`](06-application-architecture.md) and [`07`](07-design-system.md)
decide shape, not implementation: neither the feature-slice move nor the
token extraction has been carried out, and both are deliberately
independent of accounts so either can be done in a gap.
