# 05 — What is unverified

Claims this strand leans on that were not checked against a primary
source. Each says what would settle it.

| # | What is unproven | Why it matters | How to settle it |
|---|---|---|---|
| 1 | **Supabase free projects pause after ~7 days of inactivity.** Carried from [`video-calls/05`](../video-calls/05-accounts-and-access.md) §2, register item 12, still unchecked. | The failure surfaces *when a student tries to join a class*. A teaching schedule with a holiday plausibly goes seven days idle. This is the single item that could disqualify the vendor. | Read Supabase's own pricing page. Five minutes. |
| 2 | **Supabase free-tier limits** — 50,000 MAU, 500 MB database. | Secondary summaries, not the vendor. Volume is tiny, so the risk is low, but the numbers should not be quoted as fact. | Same page as item 1. |
| 3 | **GoTrue is self-hostable against the same Postgres, and this is a cheap exit.** [`02`](02-platform-dependence.md) §4 leans on it as the escape hatch that makes the whole vendor choice safer. | If self-hosting is harder than assumed, the migration story is materially worse and Supabase looks more like Clerk than claimed. | Read GoTrue's deployment docs. |
| 4 | **Supabase stores password hashes in a portable format (bcrypt).** [`02`](02-platform-dependence.md) §4 claims passwords survive a migration. | If the format is proprietary or unreachable, every user resets their password on migration — annoying but survivable. Worth knowing which. | Inspect `auth.users` on a real project. |
| 5 | **Supabase supports linking multiple identities to one user.** [`01`](01-what-this-must-do.md) §3 depends on it: magic link now, OAuth and password later, same human. | Account linking is where naive auth designs break. If it is not supported, the migration from magic link to OAuth creates duplicate people. | Supabase Auth docs on identity linking. |
| 6 | **Supabase's built-in email is unsuitable for production and needs custom SMTP.** [`01`](01-what-this-must-do.md) §3 treats this as a day-one requirement. | While magic link is the only credential, email *is* the availability of the system. | Supabase Auth SMTP docs. |
| 7 | **A Supabase project's region is chosen once and cannot be changed.** Relevant because EEA students make region a GDPR-adjacent decision. | If it is changeable, the decision is reversible and less urgent. If not, it is a one-shot choice. | Supabase project settings docs. |
| 8 | **Session lifetime is project-level, not per-role.** [`01`](01-what-this-must-do.md) §4 builds the re-authentication recommendation on it. | If per-role sessions are possible, the owner account could simply hold a shorter one and the recommendation is unnecessary. | Supabase Auth session settings. |
| 9 | **GDPR consent thresholds for minors vary by member state (13–16).** | [`01`](01-what-this-must-do.md) §6 raises it because self-registration removed the enforcement that "students are adults" previously had. | Not a code question. Legal reading, or a decision to keep enrolment gated. |

## Decisions taken without research, and knowingly

- **Slots are held while a booking is pending, with no automatic
  expiry.** The dead-slot cost is understood and accepted; see
  [`04`](04-scheduling-and-booking.md) §3.
- **No money in the model.** Accepted as safe on the argument in
  [`03`](03-the-data-model.md) §5, which depends on sessions being
  written from the first real class.
- **Concrete slots rather than recurring availability.** Accepted with
  its ongoing manual cost, in exchange for removing recurrence and DST
  entirely.
