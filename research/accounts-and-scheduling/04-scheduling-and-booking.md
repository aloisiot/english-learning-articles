# 04 — Scheduling and booking

> **The question:** How do tutors publish time, how do students take it,
> and what does crossing timezones cost?

**Short answer:** concrete slots rather than recurring availability. That
one choice removes the hardest problem in calendar software, and the
price is routine upkeep by the tutor.

---

## 1. Concrete slots, and what they buy

A tutor opens specific dates and times. There is no weekly pattern, no
recurrence engine, no exception model for holidays.

**This dissolves the timezone trap rather than solving it.** Recurring
availability cannot be stored as UTC instants: "Tuesdays at 19:00" is a
wall-clock intention in the tutor's zone, and storing it as an instant
means a DST change silently moves the tutor's published hour. Correct
handling needs two representations — rules in wall time plus IANA zone,
instants materialised from them.

With concrete slots there is nothing to re-interpret. **Every stored time
is an instant, in UTC**, exactly as `class/lib/room.ts` already does.

**Timezone therefore becomes an input and display concern only.** A tutor
types 19:00 in their zone; a student in Lisbon sees their own local time.
Nothing is stored in local time, so nothing can drift.

**The cost is real and recurring:** somebody opens slots by hand, every
week, forever. The natural upgrade is generating concrete slots from a
pattern — which keeps every property above, because the generated rows
are still instants. That upgrade is available later and is not needed
now.

## 2. A tutor's slots are invisible until the owner approves them

Opening a slot and publishing it are different acts. An unapproved tutor
may complete a profile and prepare slots; students do not see them.
Approval is recorded as `tutor_settings.approved_at`, and every query
that lists bookable slots joins through it.

Putting the gate on *visibility* rather than on slot creation is what
keeps onboarding usable: a tutor invited from another platform can set
themselves up completely while approval is pending, and become bookable
the moment it lands.

## 3. Booking approval is per tutor

`tutor_settings.requires_booking_approval`. Some tutors will want to vet
who takes their time; others will want any open slot filled without
interruption. This is a property of the tutor, not a platform policy.

Not to be confused with the owner approval in §2: that decides whether a
tutor may be booked at all, this decides how a booking is accepted.

## 4. A pending request holds the slot

**Decision:** the first student to request a slot locks it. Nobody else
may request it while the tutor decides.

The student experience is unambiguous, and double-booking is impossible.
The cost is a **dead slot**: a request made on Thursday and unanswered
until Saturday makes that time invisible to everyone else in between,
and the slot may simply pass.

Two mitigations, in order of cost:

1. Surface pending requests prominently to the tutor, and let them
   release a hold by declining. Free.
2. Expire holds automatically after a set period. Correct, and needs a
   scheduled job — which nothing in this system has yet.

The second was considered and not chosen. It should be revisited the
first time a slot is lost to it, which is a better trigger than a guess
now.

## 5. Entering the call

**Students join from their dashboard, logged in.** No emailed link, no
signed token.

The consequence is larger than it appears, and it is the reason accounts
and the session record belong in one phase: **the join endpoint now knows
who is joining.** With signed links, whoever held the link was anonymous,
and attendance was unknowable. With a session it is a fact —
`session.actual_start` becomes recordable, and so does whether the
student ever arrived.

What this does to existing code
([`08`](../video-calls/08-implementation-plan.md) predicted it): the token
path survives with a session check where the signature check is.
`/api/join` stops accepting a signed token and instead asks whether this
user is party to a confirmed booking whose slot is starting about now.
`class/lib/link.ts` keeps its tests and may end up with no caller, and
the admin link generator becomes redundant for scheduled classes.

**It should not be deleted on that day.** A signed link remains the only
way to run a class for someone without an account, which is exactly the
situation of a trial lesson with a tutor being courted from another
platform — the founding use case of this platform.

## 6. Cancellation windows

Deferred, deliberately, to whenever billing is discussed. The model
supports the question — `student_cancelled` is distinguishable from
`student_no_show`, and both carry timestamps — without answering it.
