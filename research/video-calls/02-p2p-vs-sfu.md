# 02 — 1:1 today, groups tomorrow: P2P or SFU

> **The question:** 1:1 calls can run peer-to-peer with no media server.
> Small groups cannot. Does starting 1:1 justify building the P2P
> version first?

**Short answer:** No. **The P2P saving is real but small, and it is paid
for twice** — once when you build the signalling and TURN plumbing that
P2P still needs, and again when groups arrive and it all gets thrown
away. Start on an SFU. The thing that makes P2P attractive — no media
server to pay for — turns out not to be a saving at all, because at your
volume the media server is free.

---

## 1. What P2P actually saves

In a 1:1 call, the two browsers can send media directly to each other.
No server sits in the media path. This is genuinely the lowest-latency
arrangement and the only one where the provider cannot see the media.

What it does **not** save:

- **Signalling.** The two browsers still have to exchange SDP offers,
  answers, and ICE candidates before they know each other exists. That
  needs a server both can reach, held open for the duration of
  negotiation. Vercel Functions cannot hold a WebSocket; this is a
  persistent connection or a polling hack.
- **STUN.** Free public servers exist (Google's, among others), but
  relying on someone else's free infrastructure for a class that has to
  start on time is a choice, not a default.
- **TURN.** When the two peers cannot find a direct path, all media has
  to be relayed by a server anyway — at which point you are paying for
  a media server, just a dumber one.

So "P2P has no server" is false. P2P has *no SFU*. It still has
signalling and TURN, which is most of the operational surface and all of
the debugging pain.

## 2. How often TURN is actually needed

This matters, because if relaying were rare you could plausibly ship
without TURN and accept occasional failure. The reported figures:

| Source type | Reported relay rate |
|---|---|
| Consumer WebRTC sessions, aggregated | ~15–20% |
| Large-scale conference aggregate | ~22% of conferences |
| Restrictive corporate networks | 30–40% |
| Cited overall range | 4% to 30%+ |

**Confidence: low-to-moderate, and these figures should not be quoted as
precise.** They come from vendor blogs and secondary aggregations, not
from a primary study I read; the underlying measurements are years apart
and measure different populations. See the unverified register in
[`09-sources.md`](09-sources.md).

What the range supports is a directional claim, and the direction is
enough to decide: **a meaningful minority of calls need a relay, and you
cannot predict which.** For a personal teaching practice that is the
worst possible failure mode — not "the feature is broken," but "the
feature fails for one particular student, on their home network,
repeatedly, and works fine when you test it." Carrier-grade NAT is
common on mobile broadband, which is exactly the population "students in
mixed countries" describes.

Shipping 1:1 P2P without TURN is therefore not a smaller version of the
feature. It is a version that works for you and fails for a student you
cannot debug remotely.

## 3. Where P2P stops

At three participants, mesh P2P means every browser encodes and uploads
a separate stream to every other browser. Upload bandwidth and CPU both
grow with the number of peers, and consumer upstream is the binding
constraint. Mesh is generally considered workable to about 3–4
participants and unpleasant beyond that.

You have said groups are a later possibility, not a fantasy. So the
question is not whether mesh can be made to work for two — it can — but
whether the code written for two survives the transition. It does not:
mesh and SFU differ in connection topology, track management,
subscription logic, and every piece of UI that assumes "the other
person" rather than "the other participants." The signalling protocol
you would design for mesh is not the one an SFU uses.

## 4. Why the cost argument doesn't rescue P2P

The historical case for P2P is that SFUs are expensive: someone has to
run a server that decodes nothing but forwards everything, and
bandwidth costs money. That case is sound at scale.

At your scale it evaporates. A 1:1 30-minute class is **60 participant-
minutes**. Eight students once a week is roughly 32 classes a month, or
**~1,920 participant-minutes**. Every managed provider's free tier
exceeds that several times over — see
[`03-provider-options-and-costs.md`](03-provider-options-and-costs.md).

Meanwhile a self-hosted TURN server, which the P2P path *does* require,
is a VPS you rent, secure, monitor, and renew certificates on. **The
option that avoids the media server costs more per month than the one
that includes it**, before counting your time.

## 5. The honest case for P2P

Costing the rejected option properly, because it is not absurd:

- **Privacy.** In a true P2P call no third party is in the media path.
  With an SFU the provider is, and for students in the EEA that makes
  the provider a data processor with everything that follows (see
  [`05-accounts-and-access.md`](05-accounts-and-access.md)). If media
  never touching a vendor were a hard requirement, P2P plus your own
  TURN would be the only answer. Note that LiveKit offers end-to-end
  encryption on all tiers, which narrows but does not close this gap —
  the provider still sees who talks to whom, and when.
- **No vendor.** Nothing to be repriced, deprecated, or shut down.
  Twilio's video product being discontinued is the standing reminder
  that this risk is not theoretical.
- **Learning.** If understanding WebRTC is itself a goal, mesh is the
  way to learn it. That is a legitimate reason and this document cannot
  argue against it — but it should be chosen deliberately, not arrived
  at by way of "P2P is cheaper," which is false here.

**What would have to change to make P2P the right call:** either a hard
requirement that no third party can carry class media, or growth to a
volume where per-minute pricing exceeds the cost of running your own
infrastructure. The second is a long way off. On Daily's rates the first
10,000 participant-minutes are free and the rest bill at
$0.004/minute, so a **$20** monthly bill needs about **15,000
participant-minutes** — roughly 250 classes a month, against the ~32
you run now and the ~160 a full-time teaching practice would run.
Self-hosting only starts to pay at well past a full teaching load.

## 6. Recommendation

Use an SFU from the first line of code, via a managed provider. Treat
1:1 as "an SFU room with two people in it," which is what every provider
already does. The group case then costs a layout change rather than a
rewrite, and the throwaway work is zero.
