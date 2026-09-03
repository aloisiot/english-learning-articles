# 01 — What this must do, and for whom

> **The question:** Who uses this system, in what roles, and what does an
> account have to support?

**Short answer:** the earlier strand's central assumption is inverted.
[`video-calls/README`](../video-calls/README.md) recorded *"just me, a
handful of students"* with the author teaching. **The author is the
student.** The platform exists first to let him bring his own tutors
across from another platform, and only later to become a business.

That changes the shape more than it changes the schema: the system is
**two-sided from day one**. There is no version of this where one role is
hard-coded and the other added later.

---

## 1. Who is who

| Role | Who | What they do |
|---|---|---|
| **Owner** | The author | Administers the platform. Adds and vets tutors, sees every session, corrects records. Not a teaching role. |
| **Tutor** | Invited from elsewhere, initially | Opens available slots, decides whether bookings need approval, teaches. |
| **Student** | Including the author | Books a slot, attends. |

The author holds **owner and student at once**, which is not an edge
case — it is the first month of the product. Roles must therefore be
capabilities a person has, not a single column that says what a person
*is*.

**Consequence for the model:** a `profile` does not have one role. It has
a set of them. A schema with `profile.role text` will be wrong on the
first day, by the founder.

## 2. The role gate

**Requirement, taken as given:** after sign-up the user is shown a role
definition screen and chooses to continue as tutor or student. Nothing
else in the platform is reachable until they have.

This is a genuine state, not a redirect: an account exists that has no
role yet. It needs to be representable, because a user can abandon
sign-up halfway and come back tomorrow.

Two things fall out of it.

**Self-declared tutors are unvetted by construction.** Anyone who signs
up can choose "tutor", open slots, and appear as somebody teachers'
students might book. For bootstrapping — where every tutor is personally
invited from another platform — that is fine. As a business it is not,
and the gap should be closed by the owner role rather than by changing
the gate: a tutor is self-declared but not *listed* until the owner
approves them. Recording this now costs a boolean; discovering it later
costs a public marketplace full of strangers.

**The gate is where consent belongs.** It is the one screen every user
passes through exactly once, before doing anything. Whatever the privacy
notice needs to say, this is where it is said.

## 3. Credentials, and why they are not settled

**Magic link first** — passwordless email — because it avoids inbox
friction being paid at every login, and because a clicked link *is* proof
of inbox control, which folds email verification into sign-up at no cost.

**But it is explicitly temporary.** OAuth (Google/Apple) and username +
password are intended to become the defaults. The design consequence is
that **nothing may assume a single credential type**. In particular:

- A profile is not keyed by email. Email is an attribute, and a user who
  later signs in with Google must be the same person.
- "Username + password" implies a username that is not an email address,
  so the profile needs a display identity separate from the contact one.
- Account linking — the same human arriving via magic link and later via
  Google — is a known-hard problem and is where naive designs break.
  Supabase has identity linking; it is in the register as unverified.

**While magic link is the only method, email delivery is the entire
availability of the system.** If mail stops, nobody logs in — not
students, not tutors, not the owner. This is an argument for adding a
second method sooner rather than later, and for a real transactional
email provider from the first day.

## 4. Session length

A month, so that a class is never delayed by a login. Supabase session
lifetime is a **project-level** setting, so tutors and the owner get the
same month — and the owner can see every session record.

The answer is not a shorter session for everyone. It is to leave the
session long and require fresh re-authentication for a small set of
sensitive actions, once such actions exist. None do yet, which is why
this is recorded rather than built.

## 5. What an account carries

Deliberately little, and the list is short enough to state:

- A display name — which the call already asks for on every join, calling
  it *"a temporary feature to support the initial letter"*. It stops
  being temporary here.
- An email address.
- A timezone, because classes cross countries.
- The roles held, and for tutors, whether bookings need approval.

**Not** an age, a country, a photograph, or a payment method. Each of
those is a decision with a privacy consequence, and none is needed to run
a class.

## 6. The assumption that no longer holds

[`video-calls/README`](../video-calls/README.md) records **"Students:
adults, mixed countries."** With invite-only enrolment that was
enforceable — the author knew everyone. With self-registration nothing
checks it, and under GDPR consent from a minor requires parental
authorisation, with the threshold varying by member state (13–16).

This is not a blocker and it is not solved here. It is named because the
decision that made it safe has been reversed, and nothing has replaced
it.
