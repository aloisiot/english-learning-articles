# 03 — Buy, self-host, or build: the options costed

> **Revised 2026-08-29.** **Daily has been chosen**, as recommended in
> §6. The open risk flagged there — Daily's absence of a hard spend cap —
> is addressed by the stateless design in
> [`07-two-app-architecture.md`](07-two-app-architecture.md) §7: rooms
> are created lazily with Daily's own expiry property set to the class
> end time, so they self-destruct instead of lingering. The LiveKit and
> Whereby analysis below is retained rather than trimmed, because the
> reason Daily won — free-tier headroom and the shape of the cliff past
> it — is the thing to re-check if usage grows.

> **The question:** At a handful of 1:1 classes a week, with a ceiling
> around $10–20/month, which of managed / self-hosted / raw WebRTC is
> right?

**Short answer:** Managed, and it is not close. **At this volume every
managed provider is free, so price cannot decide the question — and once
price is removed, self-hosting has nothing left to offer.** The
discriminator that does matter is not the monthly rate but *what happens
at the edge of the free tier*, and on that axis the providers differ by
an order of magnitude.

---

## 1. The volume model

Everything below rests on one number, so it should be visible.

| Assumption | Value |
|---|---|
| Class length | 30 min |
| Participants per class | 2 (teacher + student) |
| **Participant-minutes per class** | **60** |
| Students | ~8 |
| Classes per student per week | 1 |
| Classes per month | ~32 |
| **Participant-minutes per month** | **~1,920** |

A "participant minute" is one minute for one person in a call; a call of
N people for M minutes bills N × M. All three managed providers below use
this same unit, which makes them directly comparable.

For the 10× case — a full personal teaching practice of ~40 weekly
students — the figure is **~9,600 participant-minutes/month**.

## 2. The managed options, priced

All figures read from each vendor's own pricing page on **2026-08-29**;
per-source detail in [`09-sources.md`](09-sources.md).

| | Free tier | Rate after | At 1,920 min | At 9,600 min |
|---|---|---|---|---|
| **Daily** | 10,000 participant-min/mo | $0.004/min | **$0** | **$0** |
| **LiveKit Cloud (Build)** | 5,000 WebRTC min/mo, 50 GB transfer, 100 concurrent | *unstated for Build; next plan is Ship at $50/mo* | **$0** | **$50/mo** |
| **Whereby Embedded (Explore)** | 2,000 participant-min/mo, no overage permitted | — | **$0, at 96% of the cap** | not possible |
| **Whereby Embedded (Build)** | 2,000 included | $0.004/min | $9.99/mo | ~$40/mo |

Three things fall out of that table, and none of them is the number in
the "At 1,920" column.

**Every option is free today.** So the $10–20/month budget is not a
constraint on this decision at all. It is, as
[`04-the-static-export-question.md`](04-the-static-export-question.md)
argues, a constraint on something else entirely.

**The free tiers differ by 5×, and that is the whole decision.** Daily's
10,000 leaves 5× headroom over current use. LiveKit's 5,000 leaves 2.6×.
Whereby's 2,000 leaves **4%** — a single extra student, or one class that
runs long, or one group lesson, exceeds it.

**The cliffs are shaped differently.** Daily degrades gently: past 10,000
minutes you pay $0.004/min, so the 10× scenario would cost nothing and
even 20,000 minutes would cost $40. LiveKit's published path from Build
is the Ship plan at **$50/month flat**, which jumps straight past the
stated ceiling. What LiveKit actually does when a Build project passes
5,000 minutes — throttle, block, or bill — is *not stated on the pricing
page and I did not verify it*; it is the top entry in the unverified
register.

## 3. Self-hosting, costed properly

The self-hosted option is LiveKit's open-source media server, or Jitsi,
on a VPS you rent — plus coturn for TURN, which the P2P option would
need anyway.

| Item | Monthly |
|---|---|
| Small VPS (adequate for a handful of concurrent 1:1 rooms) | ~$6–12 |
| TLS certificates (Let's Encrypt) | $0 |
| Domain (already owned) | $0 |
| **Cash total** | **~$6–12** |
| Your time: initial setup, firewall/UDP port config, TURN credentials, monitoring | days |
| Your time: ongoing patching, cert renewal, "why did the call drop" | recurring |

So self-hosting is **more expensive in cash than the managed option**
(which is $0), and vastly more expensive in time. There is no volume
between here and a full teaching practice at which that reverses.

**What would have to change to make self-hosting right:** a hard
requirement that no third party carries class media or metadata, or
growth past roughly 250,000 participant-minutes a month — about 130× the
current figure — where Daily's rate would approach a serious server
bill. Neither is in view.

The honest non-cost argument for self-hosting is *permanence*: nobody can
reprice or discontinue a server you run. Twilio discontinuing its video
product is the reason that argument deserves a hearing rather than a
dismissal. The counter is that LiveKit's media server is open source and
its API is the same self-hosted as managed, so choosing LiveKit Cloud
keeps the exit cheap in a way that choosing Daily or Whereby does not.
That is a genuine point in LiveKit's favour and it partly offsets its
weaker free tier.

## 4. Raw WebRTC

Building directly on the browser's `RTCPeerConnection`, with your own
signalling server and your own coturn. Costed in
[`02-p2p-vs-sfu.md`](02-p2p-vs-sfu.md) and rejected there: it does not
avoid a server, does not survive the move to groups, and costs more per
month than the managed options because they are free.

It remains the right choice only if learning WebRTC is itself a goal.

## 5. The features you asked for, per provider

Screen sharing, in-call text chat, and a channel for syncing the article
view are all present in every managed option:

| | Screen share | Text chat | Arbitrary data messages | E2E encryption |
|---|---|---|---|---|
| Daily | yes | via app messages | `sendAppMessage` | — |
| LiveKit | yes | via data messages | `publishData` | yes, all tiers |
| Whereby Embedded | yes | built-in | limited (prebuilt UI) | — |

The **arbitrary data messages** column is the one that matters for the
shared article view, and it is where Whereby is weakest: Whereby
Embedded gives you a polished prebuilt room, which is exactly why it
does not give you much room to put your own teaching UI inside it. Daily
and LiveKit both ship low-level SDKs where the call is components you
lay out yourself. See [`06-shared-article-view.md`](06-shared-article-view.md).

Recording is not in the table because you have ruled it out. Worth
noting only that it is the single most expensive thing you could later
turn on, and the one with the largest consent surface.

## 6. Recommendation

**Daily, on the free tier, with LiveKit Cloud as the named fallback.**

Daily wins on the axis that actually varies: 10,000 free
participant-minutes is 5× current use, and the overage past it is
$0.004/min rather than a $50 step. That combination means the feature
cannot surprise you with a bill or a wall in its first year.

LiveKit is the better *second* choice and would be the first if the
open-source escape hatch were weighted more heavily, or if end-to-end
encryption were a requirement rather than a nice-to-have. Its weakness
here is narrow and specific: a 5,000-minute free tier whose next step is
$50.

Whereby is not recommended, for a reason worth stating plainly since it
is otherwise the friendliest option and is EU-based (which
[`05-accounts-and-access.md`](05-accounts-and-access.md) counts in its
favour): a 2,000-minute free tier that your *current* usage already fills
to 96% is not a free tier you can build on, and its prebuilt room is the
hardest of the three to put an article inside.

**One risk to carry forward:** Daily's own FAQ states there is no hard
cap that stops calls once the free minutes are used — usage continues at
the per-minute rate. A room accidentally left open does not fail loudly,
it bills quietly. Whatever is built should close rooms explicitly at the
end of a class rather than relying on participants leaving.
