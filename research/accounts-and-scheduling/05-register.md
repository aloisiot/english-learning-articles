# 05 — What is unverified

Claims this strand leans on that were not checked against a primary
source. Each says what would settle it.

Items move out of the table below as they are settled, into the section
above it.

---

## Settled

### 1 — The pause is real, and restoring is manual

*Checked 2026-09-03 against <https://supabase.com/pricing> and
<https://supabase.com/docs/guides/platform/free-project-pausing>.*

**The claim holds.** The pricing page states it plainly: *"Free projects
are paused after 1 week of inactivity. Limit of 2 active projects."* The
carried-over "~7 days" was accurate.

Three details the strand did not have, and one of them matters more than
the claim itself:

- **Restoring is manual.** It is a dashboard action — open the project,
  click Resume, wait somewhere between a few seconds and about three
  minutes. **Nothing about this is self-healing.** The register guessed
  the failure "surfaces when a student tries to join a class"; it is
  worse than that, because the student's arrival does not fix it. The
  teacher finds out from the student, and then goes to a dashboard.
- **There is warning.** Supabase emails the project owner twice: roughly
  a week before the pause, and again once it has happened. So the failure
  is avoidable by anyone reading that mailbox — which is a real
  mitigation, and also a single point of human failure.
- **Data survives.** A paused project can be restored for up to a year.
  But after **90 days** the automatic restore is withdrawn and the
  project's infrastructure — including its API URL — is released, which
  would change the environment variables on the other side.

**What counts as activity is deliberately not a contract.** The docs say
only that *"a few user requests to the database each day over the
previous week is enough"*, and describe the target as projects with *"too
few user queries"*. That vagueness is the vendor keeping room to tighten
a cost control, and it is the reason to distrust a keep-warm ping as an
availability strategy rather than as a convenience.

**This does not disqualify Supabase.** That is the finding. Pausing is a
free-tier billing policy, not a property of the platform: the Pro plan at
**$25/month** does not pause at all. `02` §4's exit argument is untouched,
and nothing in `03`'s data model is affected.

So the three options are not equal:

| Option | Verdict |
|---|---|
| **Pro, $25/month** | Removes the failure class outright. The recommendation. |
| **Keep-warm ping** | Works today, on an undocumented heuristic the vendor has every reason to tighten. Acceptable for a project nobody depends on; not for a class a student has paid for and scheduled around. |
| **Self-host GoTrue** | Disproportionate — it is the plan for *leaving* Supabase, not for declining a $25 bill, and it would lean on item 3, which is itself still unverified. |

**Decision: Supabase stands as the vendor, on the Pro plan before the
first real student.** The free tier is fine for the build — a pause
during development is an annoyance, not an outage, because nobody is
being let down by a project nobody is using. The upgrade is therefore
tied to an event rather than a date: **it happens before the first
student books, and before enrolment is opened to anyone outside this
repo.** Two things make the free tier survivable until then, and both
have to hold: the warning emails must reach a mailbox that is read, and
the project must not sit paused for 90 days, which would change its
API URL.

### 2 — Free-tier limits confirmed

*Same sources and date as item 1.*

Confirmed from the vendor rather than from summaries: **50,000 MAU** and
**500 MB** of database on the Free plan, alongside the **2 active
projects** limit quoted above. The strand's numbers were right.

The project count is the only one worth remembering. Two is enough for a
development project and a production one, which is the arrangement this
repo would want; a third — a staging project — would need a paid plan.
That is not a constraint today, since preview environments are
deliberately out of scope until there is a production-ready app.

Volume is nowhere near any of these limits and is not expected to be.

---

## Still unverified

| # | What is unproven | Why it matters | How to settle it |
|---|---|---|---|
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
