# 03 — The data model

> **The question:** What tables does this need, and which decisions in
> them are expensive to change later?

**Short answer:** five entities. Four are ordinary and can be migrated
freely. The fifth — `session` — is the only one that records something
which cannot be reconstructed afterwards, and it is therefore the only
one whose design is urgent.

---

## 1. The entities

```
profile          id (ours) · auth_user_id (theirs) · display_name
                 · email · timezone · created_at

profile_role     profile_id · role (owner│tutor│student)
                 -- a set, not a column: the author is owner and student

tutor_settings   profile_id · requires_approval · listed

slot             id · tutor_id · starts_at (UTC) · duration_minutes
                 · status (open│held│booked│cancelled)

booking          id · slot_id · student_id
                 · status (pending│confirmed│declined│cancelled)
                 · requested_at · decided_at

session          id · booking_id · tutor_id · student_id
                 · scheduled_start · actual_start · actual_end
                 · outcome · created_at        -- append-only
```

## 2. Why roles are a table

The author is **owner and student simultaneously**, from day one
([`01`](01-what-this-must-do.md) §1). A `profile.role` column is wrong
before the first tutor arrives. A join table costs one extra query and
removes a migration that would otherwise be certain.

`listed` on `tutor_settings` is the hook for owner approval of
self-declared tutors — a tutor exists as soon as they choose the role,
but is not offered to students until the owner says so.

## 3. Why `slot` and `booking` are separate

A slot is the tutor's statement that a time exists. A booking is a
student's claim on it. They have different lifecycles: a slot can be
opened and withdrawn with nobody involved, and a booking can be declined
while the slot returns to `open`.

Collapsing them into one table works until the first declined request,
and then it does not.

`status: held` is what a pending booking does to a slot while the tutor
decides — see [`04`](04-scheduling-and-booking.md) §3.

## 4. `session` is the record that cannot be backfilled

Everything else describes intent. `session` describes **what happened**,
and once the room has expired and the day has passed there is no way to
recover it.

Its fields exist for one reason each:

- `tutor_id` and `student_id` are **copied**, not left to be reached
  through `booking`. A session is a historical fact; it must survive a
  booking being deleted or a profile being anonymised on request.
- `scheduled_start` alongside `actual_start` and `actual_end`, because
  "the class was booked for 19:00" and "the class ran 19:04–19:33" are
  different facts and billing eventually cares about both.
- `outcome`, one of: `completed`, `student_cancelled`,
  `student_no_show`, `tutor_cancelled`, `technical_failure`. Four of the
  five are non-events, and each was asked for explicitly. A model that
  cannot tell a cancellation from a no-show cannot support any
  cancellation policy at all.

**Append-only.** Rows are inserted and never updated. A correction is a
new row referencing the one it corrects. This is what makes it a record
rather than a cache of the current opinion.

## 5. No money, and why that is safe

**Decision: no rates, prices or currency in the model yet.** Money is
settled outside the system.

This is safe *because* of §4. Adding billing later needs tutor, student,
duration and outcome — all of which are being captured. It becomes an
addition rather than a migration.

Two things must hold for that to stay true:

1. Sessions keep being written, from the first real class. A gap in the
   record is a gap in whatever is eventually invoiced from it.
2. When money arrives, the amount is **copied onto the session**, never
   looked up from the tutor's current rate. Otherwise raising a price
   silently rewrites the past.

## 6. What identity coupling this model already avoids

`profile.id` is ours; `profile.auth_user_id` is the only reference to
Supabase, and no other table mentions it — see
[`02`](02-platform-dependence.md) §3b. Changing identity provider touches
one column of one table.
