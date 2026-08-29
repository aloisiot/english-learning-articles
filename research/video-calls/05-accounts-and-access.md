# 05 — Accounts, access, and the privacy surface

> **Revised 2026-08-29.** The middle path proposed in §4 — **signed links
> first, accounts second** — has been taken. Accounts are deferred so the
> realtime feature can be tested before an identity system exists. Two
> consequences: the Supabase inactivity-pause risk in §2 is no longer on
> the critical path (it returns when accounts do), and §3's "no auth
> surface at all" is now slightly optimistic — links are generated from
> an admin page behind a shared secret, which is a small auth system.
> See [`07-two-app-architecture.md`](07-two-app-architecture.md) §7.
> §5 on GDPR is unchanged in substance but its trigger has moved: with
> no database in phase 1, the personal data you hold is whatever Daily
> holds, not a user table of your own.

> **The question:** Students will log in to join a class, and the
> accounts carry nothing else. What does that cost to build and to run,
> and what does storing student identities oblige you to?

**Short answer:** Accounts are the most expensive decision in this
strand and the one that buys the least *at present*, because an account
that carries nothing is a login screen guarding a link. **They are worth
building anyway if — and only if — they are a deliberate foundation for
class history, assigned articles or scheduling later**; as a pure access
gate they are strictly worse than a signed link. Separately: storing
student identities across mixed countries puts you inside GDPR, which is
manageable but is a real obligation rather than a formality.

---

## 1. What an account system actually requires

Even the smallest version is more than a password field:

| Piece | Why it is unavoidable |
|---|---|
| Identity store | Somewhere durable that maps a student to a credential |
| Session | A cookie or token proving a browser is still that student — and cookies are on the static-export forbidden list ([`04`](04-the-static-export-question.md)) |
| Credential recovery | Forgotten passwords, or magic links, which means transactional email that reliably reaches inboxes |
| Account lifecycle | Creating a student, deactivating one who leaves, deleting one who asks |
| The call binding | Given a logged-in student, decide which room they may join and mint the token |

Only the last line is about video. The other four are a small
application, and they are the part that will take the time.

## 2. Hosted options

| | Free tier | The catch |
|---|---|---|
| **Supabase Auth** | 50,000 monthly active users; 500 MB database; 500,000 edge function invocations | **Free projects pause after ~7 days of inactivity** |
| **Clerk** | Generous free MAU tier; drop-in UI | Another vendor; UI is opinionated and would need styling to match Quiet Editorial |
| **Auth.js + your own store** | Free | You own every edge case: sessions, recovery, email |

Supabase is otherwise the natural fit — it bundles the identity store,
the session, *and* the edge function that Path B in
[`04`](04-the-static-export-question.md) needs, so it collapses two
vendors into one.

But the inactivity pause deserves emphasis, because the failure mode
maps exactly onto how you teach. A paused project is unreachable until
someone restores it from the dashboard. A teaching schedule with a
holiday, a quiet fortnight, or a student break can plausibly go seven
days without a login — and the pause would then surface **at the moment
a student tries to join a class**, which is the worst possible time to
discover it.

**Confidence: moderate.** The seven-day figure comes from secondary
summaries of Supabase's pricing, not from Supabase's own page, which I
did not fetch. It is in the unverified register, and it should be
checked against the vendor before Supabase is chosen — it is a
five-minute check that could invalidate the recommendation.

If it holds, the mitigations are unglamorous but adequate: a scheduled
weekly ping to keep the project warm, or the paid tier, or Clerk.

## 3. The rejected option, costed: signed join links

This is what the research would otherwise recommend, so it deserves a
full accounting rather than a dismissal.

**How it works.** Each class gets a link containing the article slug, a
room id, an expiry timestamp, and an HMAC signature over all three,
signed with a secret the token function holds. The student clicks it;
the function verifies the signature and expiry and mints a call token.
Links are generated when you schedule the class and mailed with it.

**What it costs:** one function, one secret, no database, no user table,
no password reset, no transactional email, no session, no account
lifecycle. Perhaps a tenth of the work.

**What it gives you:** links that cannot be guessed, expire on their
own, are scoped to one class, and are revocable by rotating the secret.
A leaked link is useful to a stranger for exactly as long as the class
lasts.

**What it does not give you:** any notion of *who* joined. The call
knows a valid link was used, not that it was Marina. There is no
identity to attach anything to later.

**What would have to change to make links the right call:** nothing, if
access control is genuinely all accounts will ever do. That is the case
this document cannot make on your behalf, and it is why the
recommendation below is conditional rather than a contradiction of your
decision.

## 4. Reconciling this with the decision

You have decided on accounts, and that decision is recorded in the
README as the constraint the research had to respect. The honest
finding is not "you are wrong" but a sharper question:

> Accounts are the right call if class history, assigned articles, or
> scheduling are things you expect to want. They are the wrong call if
> the login screen is only ever a door.

Both of those were offered as options and you declined them for now —
so the useful thing this document can do is name the fork rather than
pretend it is settled. If accounts are a foundation, build them; the
cost is front-loaded and the payoff is real. If they are a door, signed
links do the same job for a tenth of the work and carry none of §5.

A middle path exists and is worth considering: **build signed links
first, accounts second.** Links get a working class running in days
rather than weeks, and nothing in them has to be thrown away — an
account system later mints exactly the same call token, just after a
session check instead of a signature check. The token function is the
stable part either way.

## 5. GDPR, because students are in mixed countries

If any student is in the EEA, GDPR applies to you as controller,
regardless of where you are.

**What becomes personal data the moment accounts exist:** email
addresses, names, IP addresses, login timestamps, and the audio and
video of the class itself while it is in transit.

**What follows, concretely:**

- **A processor relationship with the video vendor.** They handle
  personal data on your instructions, so you need a data processing
  agreement. LiveKit's pricing page lists a **standard DPA on every
  tier including the free one** — verified. Daily's and Whereby's DPA
  terms I did not read; unverified.
- **Transfers outside the EEA.** Daily and LiveKit are US companies;
  Whereby is Norwegian and markets itself as the European option.
  For a mixed-country roster this is the one axis on which Whereby's
  otherwise unusable free tier (see [`03`](03-provider-options-and-costs.md))
  is genuinely attractive, and it is worth naming rather than burying.
- **Data subject rights.** A student can ask what you hold and ask you
  to delete it. With accounts-that-carry-nothing this is easy — an
  email and a login timestamp. It gets harder the moment class history
  is added, which is another reason to be deliberate about §4.
- **A privacy notice.** Short, but it has to exist and has to say who
  processes the video.

**Not recording the classes is the single largest thing you have already
done for this.** Recordings are the most sensitive data such a system
can hold, they require explicit consent, they need a retention policy,
and they are the most expensive line on every provider's price list.
Declining them removes a whole category of obligation, and that decision
should be recorded in `docs/` rather than left implicit here.

**Confidence: this is a summary of well-established obligations, not
legal advice, and I am not a lawyer.** The specific question of whether
a one-person teaching practice needs a formal record of processing
activities under Article 30 turns on details this document does not
establish.

## 6. Recommendation

1. **Build the token function first**, with signed links. It is the
   piece every later design shares, and it makes a class run.
2. **Add accounts second, on Supabase** — after checking the inactivity
   pause — and only with a clear answer to "what will accounts carry a
   year from now."
3. **Keep the no-recording decision explicit**, in `docs/`, because it
   is doing more privacy work than anything else on this list.
4. **Write the privacy notice when the first non-Brazilian student
   logs in**, not later.
